const multer = require('multer')
const fs =require('fs')

module.exports={
    uploader(destination,fileNamePrefix){ // parameter bebas
        // destination : tempat dimana foto bakal disimpan
        // fileNamePrefix: nama depan filenya
        let defaultPath='./public';

        const storage=multer.diskStorage({
            destination:(req,file,cb)=>{
                const dir = defaultPath + destination;
                if(fs.existsSync(dir)){
                    console.log(dir,"exist")
                    cb(null,dir)
                }else {
                    fs.mkdir(dir,{recursive:true}, err=>cb(err,dir))
                    console.log(dir,"make")
                }
            },
            filename:(req,file,cb)=>{
                let originalname=file.originalname;
                let ext= originalname.split('.')
                let filename= fileNamePrefix + Date.now() + '.' + ext[ext.length - 1]
                cb(null,filename)
            }
        })
        const imageFilter = (req,file,callback)=>{
            const ext=/\.(jpg|jpeg|png|gif|pdf|doc|docx|xlsx)$/;
            if(!file.originalname.match(ext)){
                return callback(new Error(`Only Selected file type are allowerd`),false)
            }
            callback(null,true)
        }

        return multer ({
            storage:storage,
            fileFilter:imageFilter,
            limits:{
                fileSize: 4* 1024 * 1024 // 4mb
            }
        })
    }
}