const joi = require('joi');

const signupSchema = joi.object({
    username: joi.string().required(),
    email: joi.string().required(),
    image: joi.object().required(),
    password: joi.string().required(),
    rePassword: joi.equal(joi.ref('password')).messages({ 'any.only': 'Passwords do not match' })
});
const validator = (data) => {
    return signupSchema.validate(data, { abortEarly: false });
}
module.exports = { validator }

