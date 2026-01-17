const express = require('express');
const prisma = require('../lib/prisma');
const authenticateToken = require('../middleware/auth');
const { HISTORY_LIMIT } = require('../utils/constants');

const router = express.Router();

router.get('/history', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        const history = await prisma.resume.findMany({
            where: { userId: userId },
            take: HISTORY_LIMIT,
            orderBy: { createdAt: 'desc' },
            include: {
                analysis: {
                    select: {
                        atsScore: true
                    }
                }
            }
        });

        const formattedHistory = history.map(item => ({
            id: item.id,
            fileName: item.fileName,
            createdAt: item.createdAt,
            score: item.analysis ? item.analysis.atsScore : 'N/A'
        }));

        res.json(formattedHistory);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch history' });
    }
});

router.get('/credits', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { credits: true }
        });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({ credits: user.credits || 0 });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch credits' });
    }
});

module.exports = router;
