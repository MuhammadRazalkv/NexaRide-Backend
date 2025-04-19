import { v2 } from "cloudinary";

v2.config({
    api_key:"975787696957148",
    cloud_name:"di2fg3dfh",
    api_secret:process.env.CLOUDINARY_SECRET
})

export default v2