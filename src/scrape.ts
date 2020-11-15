import * as fs from "fs";
import { Connection, createConnection } from "typeorm";
import { promisify } from "util";
import * as webdriver from "selenium-webdriver";
import { Builder, By, until } from "selenium-webdriver";
import { getNow } from "./util";
import * as json2csv from "json2csv";
import { Blogs } from "./entity/blog";

const capabilities = webdriver.Capabilities.chrome();
capabilities.set("chromeOptions", {
  args: [
    "--headless",
    "--no-sandbox",
    "--disable-gpu",
    `--window-size=1980,1200`,
  ],
});

// awaitを使うので、asyncで囲む
(async () => {
  // データベースに接続
  const con = await createConnection();

  // ブラウザ立ち上げ
  const driver = await new Builder().withCapabilities(capabilities).build();

  // 日向坂ブログページへ
  await driver.get(
    "https://www.hinatazaka46.com/s/official/diary/member?ima=0000"
  );

  let isBlogLoop = true;
  let blogNumber = 0;

  // メンバーリンク
  const memberElements = await driver.findElements(
    By.css(".p-blog-face__group a")
  );

  const memberLinks: string[] = [];

  for (const memberElement of memberElements) {
    memberLinks.push(await memberElement.getAttribute("href"));
  }

  // メンバーの分ループ
  for (const memberlink of memberLinks) {
    // 各メンバーリンクへ遷移
    await driver.get(memberlink);

    // ページ下部のjasracが表示されるまで待つ
    await driver.wait(
      until.elementLocated(By.css(".c-jasrac__image")),
      1000000
    );

    // 個別ブログ
    const detailButton = await driver.findElement(
      By.css(".p-blog-entry__item:first-of-type a")
    );

    // 個別ページ1つ目をクリック
    await driver.get(await detailButton.getAttribute("href"));

    // ページ下部のjasracが表示されるまで待つ
    await driver.wait(
      until.elementLocated(By.css(".c-jasrac__image")),
      1000000
    );

    // メンバー名前
    const memberNameElement = await driver.findElement(
      By.css(".c-blog-member__name")
    );
    const memberName = await memberNameElement.getText();

    blogNumber = 0;
    isBlogLoop = true;
    while (isBlogLoop) {
      blogNumber++;

      // ブログタイトル
      const blogTitle = await driver.findElement(
        By.css(".c-blog-article__title")
      );

      console.log(blogNumber, await blogTitle.getText());

      // ブログURL
      const blogUrl = await driver.getCurrentUrl();

      // 投稿日
      const postDate = await driver.findElement(
        By.css(".c-blog-article__date time")
      );

      const blog = new Blogs();
      const postedAtBuf = await postDate.getText();
      const postedAt = `${postedAtBuf.replace(/\./g, "/")}:00`;

      blog.posted_by = memberName;
      blog.posted_at = new Date(postedAt);
      blog.title = await blogTitle.getText();

      blog.url = blogUrl;

      const repository = con.getRepository(Blogs);

      const existedBlog = await repository.find({
        posted_by: blog.posted_by,
        posted_at: blog.posted_at,
        title: blog.title,
      });

      if (existedBlog.length === 0) {
        // データベースに保存
        await con.manager.save(blog);
        console.log("not exist");
      } else {
        console.log("exist");
        isBlogLoop = false;
      }

      try {
        // 前投稿への遷移のエレメントを取得
        const prevLink = await driver.findElement(
          By.css(".c-pager__item--prev a")
        );
        const nextUrl = await prevLink.getAttribute("href");
        const SAITOKYOKO_2018018 =
          "https://www.hinatazaka46.com/s/official/diary/detail/26020?ima=0000&cd=member";
        const SAITOKYOKO_2018017 =
          "https://www.hinatazaka46.com/s/official/diary/detail/26016?ima=0000&cd=member";

        // 前投稿へ
        if (nextUrl !== SAITOKYOKO_2018018) {
          await driver.get(await prevLink.getAttribute("href"));
        } else {
          await driver.get(SAITOKYOKO_2018017);
        }

        // ページ下部のjasracが表示されるまで待つ
        await driver.wait(
          until.elementLocated(By.css(".c-jasrac__image")),
          10000
        );
      } catch (e) {
        isBlogLoop = false;
      }
    }

    // ブログページへ
    await driver.get(
      "https://www.hinatazaka46.com/s/official/diary/member?ima=0000"
    );

    // ページ下部のjasracが表示されるまで待つ
    await driver.wait(until.elementLocated(By.css(".c-jasrac__image")), 10000);
  }
})();
