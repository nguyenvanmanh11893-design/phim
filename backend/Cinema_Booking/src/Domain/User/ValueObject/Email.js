class Email {
  constructor(value) {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))
      throw new Error("Invalid email");
    this.value = value.toLowerCase();
  }
}

export default Email;
