const generateOrderId = (): string => {
    const idLength = 16;
    let result = '';
  
    for (let i = 0; i < idLength; i++) {
      const digit = Math.floor(Math.random() * 10);
      result += digit.toString();
    }
  
    return result;
  };
  
  export default generateOrderId;