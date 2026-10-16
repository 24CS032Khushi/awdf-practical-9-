const router = require('express').Router();
const auth = require('../middleware/auth');
const {
  validateTaskCreate,
  validateTaskUpdate,
  validateObjectId,
} = require('../middleware/validate');
const c = require('../controllers/taskController');

// Pipeline: Auth middleware -> Validation middleware -> Controller
router.use(auth); // protects ALL task routes

router.get('/', c.getTasks);
router.post('/', validateTaskCreate, c.createTask);
router.get('/:id', validateObjectId, c.getTask);
router.put('/:id', validateObjectId, validateTaskUpdate, c.updateTask);
router.delete('/:id', validateObjectId, c.deleteTask);

module.exports = router;
