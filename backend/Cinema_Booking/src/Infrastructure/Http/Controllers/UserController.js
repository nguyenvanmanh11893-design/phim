// src/Infrastructure/Http/Controllers/UserController.js
import GetProfileQuery from "../../../Application/User/Query/GetProfileQuery.js";
import ListUsersQuery from "../../../Application/User/Query/ListUsersQuery.js";
import UpdateProfileCommand from "../../../Application/User/Command/UpdateProfileCommand.js";
import ChangePasswordCommand from "../../../Application/User/Command/ChangePasswordCommand.js";
import UpdateUserRoleCommand from "../../../Application/User/Command/UpdateUserRoleCommand.js";

class UserController {
  constructor(
    getProfileHandler,
    updateProfileHandler,
    changePasswordHandler,
    listUsersHandler,
    updateUserRoleHandler,
  ) {
    this.getProfileHandler = getProfileHandler;
    this.updateProfileHandler = updateProfileHandler;
    this.changePasswordHandler = changePasswordHandler;
    this.listUsersHandler = listUsersHandler;
    this.updateUserRoleHandler = updateUserRoleHandler;
  }

  // GET /users/me
  async getProfile(req, res, next) {
    try {
      const query = new GetProfileQuery({ userId: req.user.userId });
      const result = await this.getProfileHandler.execute(query);
      res.status(200).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  // PATCH /users/me
  async updateProfile(req, res, next) {
    try {
      const command = new UpdateProfileCommand({
        ...req.body,
        userId: req.user.userId,
      });
      const result = await this.updateProfileHandler.execute(command);
      res.status(200).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  // PATCH /users/me/password
  async changePassword(req, res, next) {
    try {
      const command = new ChangePasswordCommand({
        ...req.body,
        userId: req.user.userId,
      });
      const result = await this.changePasswordHandler.execute(command);
      res.status(200).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  // GET /users — admin only
  async list(req, res, next) {
    try {
      const query = new ListUsersQuery({
        page: req.query.page ? Number(req.query.page) : undefined,
        limit: req.query.limit ? Number(req.query.limit) : undefined,
        role: req.query.role,
      });
      const result = await this.listUsersHandler.execute(query);
      res.status(200).json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  }

  // PATCH /users/:id/role — admin only
  async updateRole(req, res, next) {
    try {
      const command = new UpdateUserRoleCommand({
        targetUserId: Number(req.params.id),
        role: req.body.role,
        requesterId: req.user.userId,
      });
      const result = await this.updateUserRoleHandler.execute(command);
      res.status(200).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }
}

export default UserController;
