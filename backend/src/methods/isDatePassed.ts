import moment from 'moment';

function isDatePassed(dateString: string) {
  const inputDate = moment(dateString, 'YYYY-MM-DD');

  const currentDate = moment();
  return inputDate.isAfter(currentDate);
}

export default isDatePassed;