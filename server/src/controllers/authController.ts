import { Request, Response } from 'express';
import { UserService } from '../services/userService';
import { registerValidation } from '../validations/userValidation';
import { MONGODB_URI } from '../config/database';

export class AuthController {
    private userService: UserService;

    constructor() {
        this.userService = new UserService(MONGODB_URI);
    }

    register = async (req: Request, res: Response): Promise<void> => {
        try {
            console.log('Register isteği alındı:', req.body);
            const { error } = registerValidation.validate(req.body);
            if (error) {
                console.log('Validasyon hatası:', error.details[0].message);
                res.status(400).json({ message: error.details[0].message });
                return;
            }

            await this.userService.register(req.body);
            console.log('Kullanıcı başarıyla kaydedildi');
            res.status(201).json({ message: 'Kullanıcı başarıyla oluşturuldu' });
        } catch (error) {
            console.error('Register hatası:', error);
            if (error instanceof Error && error.message === 'Kullanıcı adı veya email zaten kullanımda') {
                res.status(400).json({ message: error.message });
            } else {
                res.status(500).json({ message: 'Sunucu hatası' });
            }
        }
    };

    login = async (req: Request, res: Response): Promise<void> => {
        try {
            const { email, password } = req.body;
            const user = await this.userService.login(email, password);
            res.json({ message: 'Giriş başarılı', user });
        } catch (error) {
            if (error instanceof Error && error.message === 'Geçersiz email veya şifre') {
                res.status(401).json({ message: error.message });
            } else {
                res.status(500).json({ message: 'Sunucu hatası' });
            }
        }
    };
} 