import Student from '../models/Student.js';
import Parent from '../models/Parent.js';
import Fee from '../models/Fee.js';
import { computeFeeStatus } from '../utils/feeStatus.js';
import { ensureStudentMonthlyFee, getDueDateForMonth, monthKeyFromDate } from '../utils/joiningFee.js';

/** Find existing parent by name or create a new parent record */
async function resolveParent(parentName, parentPhone, parentEmail) {
  const name = parentName?.trim();
  if (!name) {
    const err = new Error('Parent name is required');
    err.status = 400;
    throw err;
  }
  const phone = parentPhone?.trim() || '';
  let parent = phone
    ? await Parent.findOne({ name: new RegExp(`^${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i'), phone })
    : await Parent.findOne({ name: new RegExp(`^${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') });

  if (!parent) {
    parent = await Parent.create({
      name,
      phone: phone || 'N/A',
      email: parentEmail?.trim() || undefined,
    });
  } else {
    parent.name = name;
    if (phone) parent.phone = phone;
    if (parentEmail?.trim()) parent.email = parentEmail.trim();
    await parent.save();
  }
  return parent._id;
}

export async function listStudents(req, res, next) {
  try {
    const { search, className } = req.query;
    const filter = { isActive: true };
    if (className) filter.className = new RegExp(className, 'i');
    if (search) {
      filter.$or = [
        { name: new RegExp(search, 'i') },
        { admissionNo: new RegExp(search, 'i') },
        { className: new RegExp(search, 'i') },
      ];
    }
    const students = await Student.find(filter)
      .populate('classId', 'name')
      .populate('parentId', 'name phone email')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: students });
  } catch (err) {
    next(err);
  }
}

export async function getStudent(req, res, next) {
  try {
    const student = await Student.findById(req.params.id)
      .populate('classId', 'name')
      .populate('batchId', 'name')
      .populate('parentId');
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });
    res.json({ success: true, data: student });
  } catch (err) {
    next(err);
  }
}

export async function createStudent(req, res, next) {
  try {
    const { parentName, parentPhone, parentEmail, parentId, className, joiningDate, monthlyFeeAmount, ...rest } = req.body;
    if (!className?.trim()) {
      return res.status(400).json({ success: false, message: 'Class is required' });
    }
    if (!joiningDate) {
      return res.status(400).json({ success: false, message: 'Joining date is required' });
    }

    const body = {
      ...rest,
      className: className.trim(),
      joiningDate: new Date(joiningDate),
      monthlyFeeAmount: monthlyFeeAmount != null && monthlyFeeAmount !== '' ? Number(monthlyFeeAmount) : undefined,
      parentId: parentId || (await resolveParent(parentName, parentPhone, parentEmail)),
    };

    const student = await Student.create(body);
    await Parent.findByIdAndUpdate(body.parentId, { $addToSet: { students: student._id } });
    await ensureStudentMonthlyFee(student, Fee);

    const populated = await Student.findById(student._id)
      .populate('classId', 'name')
      .populate('parentId', 'name phone email');
    res.status(201).json({ success: true, data: populated });
  } catch (err) {
    next(err);
  }
}

export async function updateStudent(req, res, next) {
  try {
    const { parentName, parentPhone, parentEmail, parentId, className, joiningDate, monthlyFeeAmount, ...rest } = req.body;
    const body = { ...rest };

    if (className !== undefined) body.className = className.trim();
    if (joiningDate !== undefined) body.joiningDate = new Date(joiningDate);
    if (monthlyFeeAmount !== undefined && monthlyFeeAmount !== '') {
      body.monthlyFeeAmount = Number(monthlyFeeAmount);
    }

    if (parentName) {
      const existing = await Student.findById(req.params.id);
      if (existing?.parentId) {
        await Parent.findByIdAndUpdate(existing.parentId, {
          name: parentName.trim(),
          ...(parentPhone?.trim() && { phone: parentPhone.trim() }),
          ...(parentEmail?.trim() && { email: parentEmail.trim() }),
        });
        body.parentId = existing.parentId;
      } else {
        body.parentId = await resolveParent(parentName, parentPhone, parentEmail);
      }
    } else if (parentId) {
      body.parentId = parentId;
    }

    const student = await Student.findByIdAndUpdate(req.params.id, body, { new: true })
      .populate('classId', 'name')
      .populate('parentId', 'name phone email');
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

    if (joiningDate !== undefined || monthlyFeeAmount !== undefined) {
      const now = new Date();
      const month = monthKeyFromDate(now);
      const unpaid = await Fee.findOne({ studentId: student._id, month, paidDate: null });
      if (unpaid) {
        if (joiningDate !== undefined) {
          unpaid.dueDate = getDueDateForMonth(new Date(joiningDate), now.getFullYear(), now.getMonth());
        }
        if (monthlyFeeAmount !== undefined && monthlyFeeAmount !== '') {
          unpaid.amount = Number(monthlyFeeAmount);
        }
        unpaid.status = computeFeeStatus(unpaid);
        await unpaid.save();
      }
      await ensureStudentMonthlyFee(student, Fee);
    }

    res.json({ success: true, data: student });
  } catch (err) {
    next(err);
  }
}

export async function deleteStudent(req, res, next) {
  try {
    const student = await Student.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });
    res.json({ success: true, message: 'Student deactivated' });
  } catch (err) {
    next(err);
  }
}

export async function listParents(req, res, next) {
  try {
    const parents = await Parent.find().sort({ name: 1 });
    res.json({ success: true, data: parents });
  } catch (err) {
    next(err);
  }
}

export async function listClassNames(req, res, next) {
  try {
    const names = await Student.distinct('className', { isActive: true, className: { $nin: [null, ''] } });
    res.json({ success: true, data: names.sort() });
  } catch (err) {
    next(err);
  }
}

export async function listClasses(req, res, next) {
  try {
    const Class = (await import('../models/Class.js')).default;
    const Batch = (await import('../models/Batch.js')).default;
    const classes = await Class.find({ isActive: true });
    const batches = await Batch.find({ isActive: true }).populate('classId', 'name');
    res.json({ success: true, data: { classes, batches } });
  } catch (err) {
    next(err);
  }
}
