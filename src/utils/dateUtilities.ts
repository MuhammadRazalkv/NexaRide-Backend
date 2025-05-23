export const getTodayRange = () => {
  const now = Date.now();
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  const start = today.getTime();

  const end = new Date(today);
  end.setHours(23, 59, 59, 999);

  return { start, end: end.getTime() };
};

export const getThisWeekRange = () => {
  const now = Date.now();
  const today = new Date(now);
  const day = today.getDay();
  const diffToMonday = (day === 0 ? -6 : 1) - day;

  const start = new Date(today);
  start.setDate(today.getDate() + diffToMonday);
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);

  return { start: start.getTime(), end: end.getTime() };
};

export const getThisMonthRange = () => {
  const now = Date.now();
  const today = new Date(now);

  const start = new Date(today.getFullYear(), today.getMonth(), 1);
  start.setHours(0, 0, 0, 0);

  const end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  end.setHours(23, 59, 59, 999);

  return { start: start.getTime(), end: end.getTime() };
};
