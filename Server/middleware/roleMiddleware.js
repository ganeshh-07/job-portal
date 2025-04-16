const roleMiddleware = (roles) => (req, res, next) => {
  console.log('Role middleware triggered, user role:', req.user?.role, 'required roles:', roles);
  if (!req.user?.role || !roles.includes(req.user.role)) {
    console.log('Access denied, user role:', req.user?.role, 'does not match required:', roles);
    return res.status(403).json({ error: 'Access denied' });
  }
  console.log('Role check passed');
  next();
};

module.exports = roleMiddleware;