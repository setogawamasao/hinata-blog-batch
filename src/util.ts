// システム日付取得
export const getNow = () => {
  const dt = new Date();
  const yy = dt.getFullYear();
  const mm = ("00" + (dt.getMonth() + 1)).slice(-2);
  const dd = ("00" + dt.getDate()).slice(-2);
  const hh = ("00" + dt.getHours()).slice(-2);
  const mi = ("00" + dt.getMinutes()).slice(-2);
  const ss = ("00" + dt.getSeconds()).slice(-2);
  var result = yy + mm + dd + hh + mi + ss;
  return result;
};
