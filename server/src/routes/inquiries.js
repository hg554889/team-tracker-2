import { Router } from 'express';
import { Inquiry } from '../models/Inquiry.js';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { requireClubAccess } from '../middleware/clubAccess.js';
import { getPagination } from '../utils/pagination.js';
import { Roles } from '../utils/roles.js';
import { z } from 'zod';

const router = Router();

// Validation schemas
const inquiryCreateSchema = z.object({
  body: z.object({
    title: z.string().min(1, '제목을 입력해주세요.').max(200, '제목은 200자 이내로 입력해주세요.'),
    content: z.string().min(1, '내용을 입력해주세요.').max(2000, '내용은 2000자 이내로 입력해주세요.'),
    category: z.enum(['general', 'technical', 'account', 'feature', 'bug', 'other']).optional(),
    priority: z.enum(['low', 'normal', 'high', 'urgent']).optional()
  })
});

const inquiryUpdateSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
  body: z.object({
    status: z.enum(['pending', 'in_progress', 'resolved', 'closed']).optional(),
    response: z.string().optional(),
    assignedTo: z.string().optional()
  })
});

// Create inquiry (any authenticated user)
router.post('/', requireAuth, requireClubAccess, validate(inquiryCreateSchema), async (req, res, next) => {
  try {
    const { title, content, category, priority } = req.body;
    
    const inquiry = await Inquiry.create({
      userId: req.user.id,
      title,
      content,
      category: category || 'general',
      priority: priority || 'normal',
      clubId: req.user.clubId
    });

    const populatedInquiry = await Inquiry.findById(inquiry._id)
      .populate('userId', 'username email');

    res.status(201).json(populatedInquiry);
  } catch (e) {
    next(e);
  }
});

// Get my inquiries (authenticated user)
router.get('/my', requireAuth, requireClubAccess, async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const { status } = req.query;
  
  const query = { userId: req.user.id };
  if (status) query.status = status;

  const [items, total] = await Promise.all([
    Inquiry.find(query)
      .populate('userId', 'username email')
      .populate('processedBy', 'username')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 }),
    Inquiry.countDocuments(query)
  ]);

  res.json({ items, page, limit, total });
});

// Get all inquiries (ADMIN/EXECUTIVE only)
router.get('/', requireAuth, requireClubAccess, async (req, res) => {
  // Check if user has permission to view all inquiries
  if (!['ADMIN', 'EXECUTIVE'].includes(req.user.role)) {
    return res.status(403).json({ error: 'Forbidden', message: '문의 관리 권한이 없습니다.' });
  }

  const { page, limit, skip } = getPagination(req.query);
  const { status, category, priority, clubId: requestedClubId } = req.query;
  const { role, clubId: userClubId } = req.user;
  
  const query = {};
  
  // Filter by status, category, priority if provided
  if (status) query.status = status;
  if (category) query.category = category;
  if (priority) query.priority = priority;

  // Club filtering
  if (role === Roles.ADMIN) {
    // ADMIN can see all clubs or filter by specific club
    if (requestedClubId) {
      query.clubId = requestedClubId;
    }
  } else {
    // EXECUTIVE can only see their club's inquiries
    query.clubId = userClubId;
  }

  const [items, total] = await Promise.all([
    Inquiry.find(query)
      .populate('userId', 'username email')
      .populate('assignedTo', 'username')
      .populate('processedBy', 'username')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 }),
    Inquiry.countDocuments(query)
  ]);

  res.json({ items, page, limit, total });
});

// Get single inquiry
router.get('/:id', requireAuth, requireClubAccess, async (req, res) => {
  const inquiry = await Inquiry.findById(req.params.id)
    .populate('userId', 'username email')
    .populate('assignedTo', 'username')
    .populate('processedBy', 'username');
    
  if (!inquiry) {
    return res.status(404).json({ error: 'InquiryNotFound' });
  }

  // Check permission - user can see their own inquiries, ADMIN/EXECUTIVE can see all in their scope
  const canView = 
    inquiry.userId._id.toString() === req.user.id ||
    (['ADMIN', 'EXECUTIVE'].includes(req.user.role) && 
     (req.user.role === 'ADMIN' || inquiry.clubId === req.user.clubId));

  if (!canView) {
    return res.status(403).json({ error: 'Forbidden', message: '이 문의를 볼 권한이 없습니다.' });
  }

  res.json(inquiry);
});

// Update inquiry (ADMIN/EXECUTIVE only)
router.put('/:id', requireAuth, requireClubAccess, validate(inquiryUpdateSchema), async (req, res, next) => {
  try {
    // Check if user has permission to update inquiries
    if (!['ADMIN', 'EXECUTIVE'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden', message: '문의 처리 권한이 없습니다.' });
    }

    const inquiry = await Inquiry.findById(req.params.id);
    if (!inquiry) {
      return res.status(404).json({ error: 'InquiryNotFound' });
    }

    // Check club permission for EXECUTIVE
    if (req.user.role === 'EXECUTIVE' && inquiry.clubId !== req.user.clubId) {
      return res.status(403).json({ error: 'Forbidden', message: '이 문의를 처리할 권한이 없습니다.' });
    }

    const updates = req.body;
    
    // Set processing info if status is being changed
    if (updates.status && updates.status !== inquiry.status) {
      updates.processedBy = req.user.id;
      updates.processedAt = new Date();
    }

    const updatedInquiry = await Inquiry.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true }
    )
      .populate('userId', 'username email')
      .populate('assignedTo', 'username')
      .populate('processedBy', 'username');

    res.json(updatedInquiry);
  } catch (e) {
    next(e);
  }
});

// Delete inquiry (ADMIN only)
router.delete('/:id', requireAuth, requireClubAccess, async (req, res) => {
  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Forbidden', message: '문의 삭제는 관리자만 가능합니다.' });
  }

  const inquiry = await Inquiry.findByIdAndDelete(req.params.id);
  if (!inquiry) {
    return res.status(404).json({ error: 'InquiryNotFound' });
  }

  res.json({ message: '문의가 삭제되었습니다.' });
});

export default router;