// middleware/authorize.js
module.exports = function authorizeRole(requiredRole) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
    if (req.user.role !== requiredRole) return res.status(403).json({ error: 'Forbidden' });
    next();
  };
};
