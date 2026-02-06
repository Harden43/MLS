import { Router } from 'express';
import { authService } from '../services/auth.service';
import { validate } from '../middleware/validate';
import { authenticate } from '../middleware/auth';
import { registerSchema, loginSchema, refreshTokenSchema } from '../schemas/auth.schema';

const router = Router();

router.post('/register', validate(registerSchema), async (req, res) => {
  try {
    const { email, password, name, role } = req.body;
    const result = await authService.register(email, password, name, role);
    res.status(201).json({ data: result });
  } catch (error: any) {
    if (error.message === 'Email already registered') {
      return res.status(409).json({ error: error.message });
    }
    console.error(error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

router.post('/login', validate(loginSchema), async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await authService.login(email, password);
    res.json({ data: result });
  } catch (error: any) {
    if (error.message === 'Invalid credentials') {
      return res.status(401).json({ error: error.message });
    }
    console.error(error);
    res.status(500).json({ error: 'Login failed' });
  }
});

router.post('/refresh', validate(refreshTokenSchema), async (req, res) => {
  try {
    const { refreshToken } = req.body;
    const tokens = await authService.refreshTokens(refreshToken);
    res.json({ data: tokens });
  } catch (error: any) {
    res.status(401).json({ error: 'Invalid refresh token' });
  }
});

router.post('/logout', authenticate, async (req, res) => {
  try {
    await authService.logout(req.user!.id);
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Logout failed' });
  }
});

router.get('/me', authenticate, async (req, res) => {
  res.json({ data: req.user });
});

export default router;
