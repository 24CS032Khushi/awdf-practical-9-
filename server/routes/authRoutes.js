const router = require('express').Router();
const { register, login, me } = require('../controllers/authController');
const auth = require('../middleware/auth');
const { validateRegister, validateLogin } = require('../middleware/validate');

router.post('/register', validateRegister, register);
router.post('/login', validateLogin, login);
router.get('/me', auth, me);

module.exports = router;
