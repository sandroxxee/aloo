function maskContact(contact) {
  if (!contact) return '';
  const str = String(contact);
  
  if (str.includes('@')) {
    const [name, domain] = str.split('@');
    if (name.length <= 2) return str;
    return name.substring(0, 2) + '***@' + domain;
  }
  
  if (str.length >= 8) {
    if (str.includes('(') && str.includes(')')) {
       const parts = str.split(')');
       if (parts.length === 2) {
          const ddd = parts[0] + ')';
          let num = parts[1].trim();
          if (num.length >= 8) {
            return ddd + ' ' + num.charAt(0) + '****-**' + num.slice(-2);
          }
       }
    } else {
       return str.substring(0, 4) + '****' + str.slice(-2);
    }
  }
  
  return str;
}
console.log(maskContact('(11) 98765-4321'));
console.log(maskContact('(11) 3333-4321'));
console.log(maskContact('11987654321'));
console.log(maskContact('joao@gmail.com'));
