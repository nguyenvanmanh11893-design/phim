// Application/Auth/Command/LogoutCommand.js
class LogoutCommand {
  constructor({ refreshToken, logoutAll = false, userId }) {
    this.refreshToken = refreshToken;
    this.logoutAll = logoutAll;
    this.userId = userId;
  }
}

export default LogoutCommand;
