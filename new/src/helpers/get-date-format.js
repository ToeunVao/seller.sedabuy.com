// value = string

import moment from 'moment';

const dateFormat = 'DD.MM.YYYY';
const hourFormat = 'HH:mm';

export const getDateFormat = ({ date, showHour = true }) => {
  if (showHour) {
    return moment(date).format(`${dateFormat} ${hourFormat}`);
  }
  return moment(date).format(dateFormat);
};
