const getCurrentDate = (): string => {
    const currentDate = new Date();
  
    const day = currentDate.getDate().toString().padStart(2, '0');
    const month = (currentDate.getMonth() + 1).toString().padStart(2, '0');
    const year = currentDate.getFullYear();
  
    return `${day}.${month}.${year}`;
  };
  
  export default getCurrentDate;