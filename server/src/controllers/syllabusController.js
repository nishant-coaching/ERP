import SyllabusProgress from '../models/SyllabusProgress.js';

export async function listSyllabus(req, res, next) {
  try {
    const filter = {};
    if (req.query.className) filter.className = req.query.className.trim();

    const items = await SyllabusProgress.find(filter).sort({ className: 1, subject: 1 });

    const grouped = {};
    for (const item of items) {
      const key = item.className;
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(item);
    }

    res.json({ success: true, data: grouped, list: items });
  } catch (err) {
    next(err);
  }
}

export async function createSyllabus(req, res, next) {
  try {
    const { className, subject, currentChapter, totalChapters, completedChapters, teacherName, notes } =
      req.body;

    if (!className?.trim() || !subject?.trim() || !currentChapter?.trim()) {
      return res.status(400).json({ success: false, message: 'Class, subject and current chapter are required' });
    }
    if (completedChapters > totalChapters) {
      return res.status(400).json({ success: false, message: 'Completed chapters cannot exceed total chapters' });
    }

    const item = await SyllabusProgress.create({
      className: className.trim(),
      subject: subject.trim(),
      currentChapter: currentChapter.trim(),
      totalChapters: Number(totalChapters),
      completedChapters: Number(completedChapters) || 0,
      teacherName: teacherName?.trim(),
      notes: notes?.trim(),
      updatedBy: req.user._id,
    });

    res.status(201).json({ success: true, data: item });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ success: false, message: 'This subject already exists for this class' });
    }
    next(err);
  }
}

export async function updateSyllabus(req, res, next) {
  try {
    const body = { ...req.body, updatedBy: req.user._id };
    if (body.completedChapters > body.totalChapters) {
      return res.status(400).json({ success: false, message: 'Completed chapters cannot exceed total chapters' });
    }

    const item = await SyllabusProgress.findByIdAndUpdate(req.params.id, body, { new: true });
    if (!item) return res.status(404).json({ success: false, message: 'Record not found' });
    res.json({ success: true, data: item });
  } catch (err) {
    next(err);
  }
}

export async function deleteSyllabus(req, res, next) {
  try {
    await SyllabusProgress.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Deleted' });
  } catch (err) {
    next(err);
  }
}
