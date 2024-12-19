import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import model from '../model/model';

const refreshToken = (id: string): string => {
    return jwt.sign({ id }, process.env.JWT_SECRET as string, { expiresIn: '1h' });
};

const checkToken = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const accessToken = req.headers['accesstoken'] as string | undefined;
        if (!accessToken) {
            res.status(401).json({ message: 'Unauthorized: Access token is missing' });
            return
        }

        const decodedToken = jwt.decode(accessToken) as { id: string } | null;
        if (!decodedToken || !decodedToken.id) {
            res.status(401).json({ message: 'Unauthorized: Invalid token' });
            return
        }

        jwt.verify(accessToken, process.env.JWT_SECRET as string, (err, user) => {
            if (err) {
                if (err.name === 'TokenExpiredError') {
                    const newToken = refreshToken(decodedToken.id);
                    res.status(401).json({ message: 'Token expired', newToken });
                    return
                }
                res.status(403).json({ message: 'Forbidden: Invalid token' });
                return
            }
            res.locals.user = { userId: decodedToken?.id };
            next();
        });
    } catch (error) {
        res.status(500).json({ message: 'Internal server error', error });
        return
    }
};

const checkUser = async (req: Request, res: Response) => {
    try {
        const { userId } = res.locals.user
        const user = await model.User.findById(userId).select('_id')
        if (!user) {
            res.status(404).json({ message: 'User not found' })
            return
        }
        res.status(200).json({ message: 'User found' })
    } catch (error) {
        console.error(error)
        res.status(500).json({message:'Server error'})
    }
}


export default {
    checkToken,
    checkUser,
    refreshToken
}
