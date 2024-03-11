import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";
import { Router} from "express";
import { deleteVideo, getAllVideos, getVideoById, publishVideo, togglePublishStatus, updateVideo } from "../controllers/video.controller.js";

const router = Router();
// router.use(verifyJWT);
router
    .route("/")
    .get(getAllVideos)
    .post(
        verifyJWT,
        upload.fields([
            {
                name: "videoFile",
                maxCount:1
            },
            {
                name: "thumbnail",
                maxCount: 1
            }

        ]),
        publishVideo
    )

router
.route("/v/:videoId")
.get(verifyJWT, getVideoById)
.delete(verifyJWT, deleteVideo)
.patch(verifyJWT, upload.single("thumbnail"), updateVideo);

router
.route("/toggle/publish/:videoId")
.patch(verifyJWT, togglePublishStatus);

export default router;