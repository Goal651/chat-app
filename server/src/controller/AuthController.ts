import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const refreshToken = (email: string): string => {
    return jwt.sign({ email }, process.env.JWT_SECRET as string, { expiresIn: '1h' });
};

const checkUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const accessToken = req.headers['accesstoken'] as string | undefined;

        // Check if the token is provided
        if (!accessToken) {
            res.status(401).json({ message: 'Unauthorized: Access token is missing' });
            return
        }

        // Decode the token to extract user details
        const decodedToken = jwt.decode(accessToken) as { id: string } | null;
        if (!decodedToken || !decodedToken.id) {
            res.status(401).json({ message: 'Unauthorized: Invalid token' });
            return
        }

        // Verify the token
        jwt.verify(accessToken, process.env.JWT_SECRET as string, (err, user) => {
            if (err) {
                // Handle expired token
                if (err.name === 'TokenExpiredError') {
                    const newToken = refreshToken(decodedToken.id);
                    res.status(401).json({ message: 'Token expired', newToken });
                    return
                }
                // Handle other JWT verification errors
                res.status(403).json({ message: 'Forbidden: Invalid token' });
                return
            }
            res.locals.user = { userId: decodedToken?.id  };
            next();
        });
    } catch (error) {
        res.status(500).json({ message: 'Internal server error', error });
        return
    }
};

export default checkUser;
