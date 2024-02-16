// const asyncHandler = (fn) = async (req, res, next) => {
//     try{
//         await fn(req,res, next)
//     }
//     catch(error){
//         res.status(error).json({
//             success: false,
//             message: error.message
//         })
//     }
// }

const asyncHandler = (requestHandler) => {
    (req, res, next) => {
        Promise.resolve(requestHandler(req, res, next))
        .catch((err) => next(err));
    }
}

export { asyncHandler}