// Application/Auth/Command/RegisterCommand.js
class RegisterCommand {
  constructor({ name, email, password }) {
    this.name = name;
    this.email = email;
    this.password = password;
  }
}

export default RegisterCommand;
