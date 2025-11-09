/**
 * Task Controller
 * 
 * Handles all task-related operations using MongoDB/Mongoose.
 */

const Task = require('../models/Task');
const User = require('../models/User');
const { createTaskAssignmentNotification, createTaskUpdateNotification } = require('../services/notificationService');

/**
 * Create Task
 */
const createTask = async (req, res) => {
  try {
    const { title, description, assignedTo, status = 'pending', priority = 'medium', dueDate } = req.body;
    const createdBy = req.user.id;

    // Verify assigned user exists if provided
    if (assignedTo && assignedTo !== '' && assignedTo !== null) {
      const assignedUser = await User.findById(assignedTo);
      if (!assignedUser) {
        return res.status(400).json({ error: 'Assigned user not found' });
      }
    }

    // Create task
    const task = new Task({
      title,
      description: description || undefined,
      assignedTo: (assignedTo && assignedTo !== '' && assignedTo !== null) ? assignedTo : null,
      status,
      priority,
      dueDate: new Date(dueDate),
      createdBy
    });

    await task.save();

    // Populate user information
    await task.populate('assignedTo', 'username email');
    await task.populate('createdBy', 'username');

    // Create notification if task is assigned to a user
    if (task.assignedTo) {
      await createTaskAssignmentNotification(task, task.assignedTo);
    }

    res.status(201).json({
      message: 'Task created successfully',
      task: {
        ...task.toObject(),
        id: task._id.toString(),
        assignedTo: task.assignedTo ? task.assignedTo._id.toString() : null,
        createdBy: task.createdBy._id.toString(),
        assignedToUsername: task.assignedTo?.username || null,
        createdByUsername: task.createdBy?.username
      }
    });
  } catch (error) {
    console.error('Create task error:', error);
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ error: errors.join(', ') });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Get All Tasks
 */
const getTasks = async (req, res) => {
  try {
    const { status, priority, assignedTo, page = 1, limit = 10 } = req.query;
    const user = req.user;

    // Parse pagination parameters
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = Math.min(parseInt(limit, 10) || 10, 100); // Max 100 items per page
    const skip = (pageNum - 1) * limitNum;

    // Build query
    const query = {};

    // Role-based filtering
    if (user.role === 'user') {
      query.assignedTo = user.id;
    } else if (user.role === 'manager') {
      query.$or = [
        { createdBy: user.id },
        { assignedTo: user.id }
      ];
    }
    // Admin can see all tasks (no filter)

    // Additional filters
    if (status) {
      query.status = status;
    }
    if (priority) {
      query.priority = priority;
    }
    // Only filter by assignedTo if a specific user ID is provided (not empty string)
    // Empty string means "all users" for admin/manager
    if (assignedTo && assignedTo.trim() !== '') {
      query.assignedTo = assignedTo;
    }

    // Get total count for pagination
    const total = await Task.countDocuments(query);

    // Get tasks with populated user information
    const tasks = await Task.find(query)
      .populate('assignedTo', 'username')
      .populate('createdBy', 'username')
      .sort({ dueDate: 1, createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    // Format response
    const formattedTasks = tasks.map(task => ({
      ...task.toObject(),
      id: task._id.toString(),
      assignedTo: task.assignedTo ? task.assignedTo._id.toString() : null,
      createdBy: task.createdBy._id.toString(),
      assignedToUsername: task.assignedTo?.username || null,
      createdByUsername: task.createdBy?.username
    }));

    res.json({
      tasks: formattedTasks,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Get Task by ID
 */
const getTaskById = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;

    const task = await Task.findById(id)
      .populate('assignedTo', 'username')
      .populate('createdBy', 'username');

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Role-based access control
    if (user.role === 'user' && task.assignedTo?.toString() !== user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }
    if (user.role === 'manager' && 
        task.createdBy.toString() !== user.id && 
        task.assignedTo?.toString() !== user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({
      task: {
        ...task.toObject(),
        id: task._id.toString(),
        assignedTo: task.assignedTo ? task.assignedTo._id.toString() : null,
        createdBy: task.createdBy._id.toString(),
        assignedToUsername: task.assignedTo?.username || null,
        createdByUsername: task.createdBy?.username
      }
    });
  } catch (error) {
    console.error('Get task by ID error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Update Task
 */
const updateTask = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;
    const updates = req.body;

    // Get existing task
    const existingTask = await Task.findById(id);
    if (!existingTask) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Role-based access control
    if (user.role === 'user') {
      if (existingTask.assignedTo?.toString() !== user.id) {
        return res.status(403).json({ error: 'You can only update tasks assigned to you' });
      }
      // Users can only update status
      const allowedFields = ['status'];
      const updateFields = Object.keys(updates);
      const invalidFields = updateFields.filter(field => !allowedFields.includes(field));
      if (invalidFields.length > 0) {
        return res.status(403).json({ 
          error: `Users can only update status. Invalid fields: ${invalidFields.join(', ')}` 
        });
      }
    } else if (user.role === 'manager') {
      if (existingTask.createdBy.toString() !== user.id && 
          existingTask.assignedTo?.toString() !== user.id) {
        return res.status(403).json({ error: 'You can only update tasks you created or are assigned to' });
      }
    }

    // Track if assignment changed for notification
    const wasAssigned = existingTask.assignedTo ? existingTask.assignedTo.toString() : null;
    const willBeAssigned = updates.assignedTo && updates.assignedTo !== '' && updates.assignedTo !== null 
      ? updates.assignedTo.toString() 
      : null;
    const assignmentChanged = wasAssigned !== willBeAssigned;

    // Verify assigned user exists if provided
    let newAssignedUser = null;
    if (updates.assignedTo && updates.assignedTo !== '' && updates.assignedTo !== null) {
      newAssignedUser = await User.findById(updates.assignedTo);
      if (!newAssignedUser) {
        return res.status(400).json({ error: 'Assigned user not found' });
      }
    } else if (updates.assignedTo === null || updates.assignedTo === '') {
      // Allow unassigning (setting to null)
      updates.assignedTo = null;
    }

    // Update task - only update provided fields
    Object.keys(updates).forEach(key => {
      if (key === 'dueDate') {
        // Ensure dueDate is a Date object
        existingTask[key] = new Date(updates[key]);
      } else {
        existingTask[key] = updates[key];
      }
    });
    
    existingTask.updatedAt = new Date();
    await existingTask.save();

    // Populate user information
    await existingTask.populate('assignedTo', 'username email');
    await existingTask.populate('createdBy', 'username');

    // Create notification if task was assigned to a new user
    if (assignmentChanged && newAssignedUser && existingTask.assignedTo) {
      await createTaskAssignmentNotification(existingTask, existingTask.assignedTo);
    } else if (existingTask.assignedTo && !assignmentChanged) {
      // Task was updated but assignment didn't change - notify assigned user
      const changes = Object.keys(updates).filter(key => key !== 'assignedTo');
      if (changes.length > 0) {
        await createTaskUpdateNotification(existingTask, existingTask.assignedTo, changes);
      }
    }

    res.json({
      message: 'Task updated successfully',
      task: {
        ...existingTask.toObject(),
        id: existingTask._id.toString(),
        assignedTo: existingTask.assignedTo ? existingTask.assignedTo._id.toString() : null,
        createdBy: existingTask.createdBy._id.toString(),
        assignedToUsername: existingTask.assignedTo?.username || null,
        createdByUsername: existingTask.createdBy?.username
      }
    });
  } catch (error) {
    console.error('Update task error:', error);
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ error: errors.join(', ') });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Delete Task
 */
const deleteTask = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;

    const existingTask = await Task.findById(id);
    if (!existingTask) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Role-based access control
    if (user.role === 'user') {
      return res.status(403).json({ error: 'Users cannot delete tasks' });
    }
    if (user.role === 'manager' && existingTask.createdBy.toString() !== user.id) {
      return res.status(403).json({ error: 'You can only delete tasks you created' });
    }

    await Task.findByIdAndDelete(id);

    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  createTask,
  getTasks,
  getTaskById,
  updateTask,
  deleteTask
};
