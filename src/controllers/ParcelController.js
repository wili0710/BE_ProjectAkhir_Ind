const {db}=require('../connections')
const {uploader} = require('./../helpers')
const fs=require('fs')

const QueryProm = (sql) => {
    return new Promise ((resolve,reject)=>{
        db.query(sql,(error,result)=>{
            if (error) {
                reject(error);
            }else{
                resolve(result);
            };
        });
    });
};

module.exports={
    addParcel:(request,response) => {
        const {name, price, category, item} = request.body;
        console.log(name,price,category,item);
        // const path='/parcel'
        // const upload=uploader.uploader(path,'BUKTI').fields([{ name: 'bukti' }])
        let datainsert = { 
            nama                : name,
            harga               : price,
            categoryparcel_id   : category
        };
        let sql = `INSERT INTO parcel SET ?`;
        db.beginTransaction((error)=>{
            // ***** //
            if(error) return response.status(500).send({message:error+"Add a"});
            // ***** //
            db.query(sql,datainsert,(error)=>{
                // ***** //
                if(error) return response.status(500).send({message:error+"Add b"});
                // ***** //
                sql = `SELECT * FROM parcel WHERE nama=${db.escape(name)}`
                db.query(sql,(error,dataparcel)=>{
                    // ***** //
                    if(error) return response.status(500).send({message:error+"Add c"});
                    // ***** //
                    let arr = [];
                    item.forEach((val) => {
                        arr.push(QueryProm(
                            `INSERT INTO parcel_has_categoryproduct
                                SET parcel_id = ${db.escape(dataparcel[0].id)},
                                    categoryproduct_id = ${db.escape(val.category_item)},
                                    qty = ${db.escape(val.qty_item)}
                            `
                        ));
                    });
                    Promise.all(arr).then((result)=>{
                        db.commit((error)=>{
                            // ***** //
                            if(error) {
                                return db.rollback(()=>{
                                    response.status(500).send(error);
                                });
                            };
                            // ***** //
                            console.log(result);
                            return response.status(200).send("Data Parcel Baru berhasil di input");
                        });
                    }).catch((error)=>{
                        // ***** //
                        if(error) {
                            return db.rollback(()=>{
                                response.status(500).send(error);
                            });
                        };
                        // ***** //
                        console.log(error+"Add d");
                        return response.status(500).send(error);
                    });
                });
            });
        });
    }
};
