// Infrastructure/Http/Controllers/AuthController.js
import RegisterCommand from "../../../Application/Auth/Command/RegisterCommand.js";
import LoginCommand from "../../../Application/Auth/Command/LoginCommand.js";
import LogoutCommand from "../../../Application/Auth/Command/LogoutCommand.js";
import RefreshTokenCommand from "../../../Application/Auth/Command/RefreshTokenCommand.js";

class AuthController {
  constructor(
    registerHandler,
    loginHandler,
    logoutHandler,
    refreshTokenHandler,
  ) {
    this.registerHandler = registerHandler;
    this.loginHandler = loginHandler;
    this.logoutHandler = logoutHandler;
    this.refreshTokenHandler = refreshTokenHandler;
  }

  async register(req, res, next) {
    try {
      const command = new RegisterCommand(req.body);
      const result = await this.registerHandler.execute(command);

      res.status(201).json({
        success: true,
        data: result,
      });
    } catch (err) {
      next(err); // đẩy sang errorMiddleware xử lý tập trung
    }
  }

  async login(req, res, next) {
    try {
      const command = new LoginCommand(req.body);
      const result = await this.loginHandler.execute(command);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  async refreshToken(req, res, next) {
    try {
      const command = new RefreshTokenCommand({
        refreshToken: req.body.refreshToken,
      });
      const result = await this.refreshTokenHandler.execute(command);
      res.status(200).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async logout(req, res, next) {
    try {
      const command = new LogoutCommand({
        refreshToken: req.body.refreshToken,
        logoutAll: req.body.logoutAll ?? false,
        userId: req.user.userId,
      });
      const result = await this.logoutHandler.execute(command);
      res.status(200).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }
}

export default AuthController;
