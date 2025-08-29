// middleware/auth.js
const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
	try {
		const authHeader = req.headers["authorization"] || req.headers["Authorization"];
		if (!authHeader) return res.status(401).json({ message: "Authorization header missing" });

		const [scheme, token] = authHeader.split(" ");
		if (scheme !== "Bearer" || !token) return res.status(401).json({ message: "Invalid authorization format" });

		const decoded = jwt.verify(token, process.env.JWT_SECRET);
		req.user = { id: decoded.id, role: decoded.role };
		next();
	} catch (err) {
		return res.status(401).json({ message: "Invalid or expired token" });
	}
};
