const express = require('express');
const Note = require('../models/Note');
const { authenticateToken } = require('../middleware/auth');
const eventBus = require('../utils/eventBus');

const router = express.Router();
router.use(authenticateToken);

router.post('/', async (req, res) => {
  try {
    const { title, content } = req.body;
    if (!title || !content) return res.status(400).json({ message: 'Title and content are required' });
    const note = await Note.create({ title, content, owner: req.user._id });
    eventBus.emit('note:created', { noteId: note.id, userId: req.user.id });
    return res.status(201).json({ message: 'Note created successfully', note });
  } catch (error) {
    if (error.name === 'ValidationError') return res.status(400).json({ message: error.message });
    console.error('[create note]', error.message);
    return res.status(500).json({ message: 'Unable to create note' });
  }
});

router.get('/', async (req, res) => {
  try {
    const notes = await Note.find({ owner: req.user._id }).sort({ createdAt: -1 });
    return res.status(200).json({ count: notes.length, notes });
  } catch (error) {
    console.error('[list notes]', error.message);
    return res.status(500).json({ message: 'Unable to fetch notes' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const note = await Note.findOne({ _id: req.params.id, owner: req.user._id });
    if (!note) return res.status(404).json({ message: 'Note not found' });
    return res.status(200).json({ note });
  } catch (error) {
    if (error.name === 'CastError') return res.status(400).json({ message: 'Invalid note ID' });
    return res.status(500).json({ message: 'Unable to fetch note' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { title, content } = req.body;
    if (!title || !content) return res.status(400).json({ message: 'Title and content are required' });
    const note = await Note.findOneAndUpdate(
      { _id: req.params.id, owner: req.user._id },
      { title, content },
      { new: true, runValidators: true }
    );
    if (!note) return res.status(404).json({ message: 'Note not found' });
    eventBus.emit('note:updated', { noteId: note.id, userId: req.user.id });
    return res.status(200).json({ message: 'Note updated successfully', note });
  } catch (error) {
    if (error.name === 'CastError') return res.status(400).json({ message: 'Invalid note ID' });
    if (error.name === 'ValidationError') return res.status(400).json({ message: error.message });
    return res.status(500).json({ message: 'Unable to update note' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const note = await Note.findOneAndDelete({ _id: req.params.id, owner: req.user._id });
    if (!note) return res.status(404).json({ message: 'Note not found' });
    eventBus.emit('note:deleted', { noteId: note.id, userId: req.user.id });
    return res.status(200).json({ message: 'Note deleted successfully' });
  } catch (error) {
    if (error.name === 'CastError') return res.status(400).json({ message: 'Invalid note ID' });
    return res.status(500).json({ message: 'Unable to delete note' });
  }
});

module.exports = router;
