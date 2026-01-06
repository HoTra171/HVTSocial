import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/vi';

dayjs.extend(relativeTime);
dayjs.locale('vi');

export const safeFromNow = (d) => {
  if (!d) return "";
  try {
    return dayjs(d).fromNow();
  } catch {
    return "";
  }
};

export { dayjs };
