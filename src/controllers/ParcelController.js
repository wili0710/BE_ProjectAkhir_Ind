const {db} = require('../connections')
const {uploader} = require('./../helpers')
const fs = require('fs');

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
    getallParcels:(request,response) => {
        let sql=`SELECT * FROM parcel WHERE isdeleted=0`
        db.query(sql,(error,allparcel)=>{
            if(error) return response.status(500).send({message:error});
            /////////////////////////
            // console.log(allparcel)
            let arr = [];
            allparcel.forEach((val)=>{
                arr.push(QueryProm(
                    `SELECT *
                     FROM parcel_has_categoryproduct
                     WHERE parcel_id=${db.escape(val.id)}
                     `
                ))
            });
            Promise.all(arr)
            .then((item)=>{
                // console.log(result);
                return response.status(200).send({allparcel,item});
            }).catch((error)=>{
                return response.status(500).send(error);
            });
        });
    },

    addParcel:(request,response) => {
        const {nama, harga, categoryparcel_id, gambar, item} = request.body;
        console.log(nama,harga,categoryparcel_id,gambar,item);
        let datainsert = { 
            nama,                
            harga,               
            categoryparcel_id,
            gambar
        };
        let sql = `INSERT INTO parcel SET ?`;
        db.beginTransaction((error)=>{
            if(error) return response.status(500).send({message:error+"Add a"});
            //////////////////////////////////
            db.query(sql,datainsert,(error)=>{
                if(error) return response.status(500).send({message:error+"Add b"});
                //////////////////////////////////////////////////////////
                sql = `SELECT * FROM parcel WHERE nama=${db.escape(nama)}`
                db.query(sql,(error,dataparcel)=>{
                    if(error) return response.status(500).send({message:error+"Add c"});    
                    /////////////
                    let arr = [];
                    item.forEach((val) => {
                        arr.push(QueryProm(
                            `INSERT INTO parcel_has_categoryproduct
                                SET parcel_id = ${db.escape(dataparcel[0].id)},
                                    categoryproduct_id = ${db.escape(val.categoryproduct_id)},
                                    qty = ${db.escape(val.qty_item)}
                            `
                        ));
                    });
                    Promise.all(arr).then(()=>{
                        db.commit((error)=>{
                            if(error) return db.rollback(() => {response.status(500).send(error)});
                            ////////////////////////////////////////////
                            sql=`SELECT * FROM parcel WHERE isdeleted=0`
                            db.query(sql,(error,allparcel)=>{
                            if(error) return response.status(500).send({message:error});
                            /////////////
                            let arr = [];
                            allparcel.forEach((val)=>{
                                arr.push(QueryProm(
                                    `SELECT * FROM parcel_has_categoryproduct
                                        WHERE parcel_id=${db.escape(val.id)}`
                                    ))
                                });
                                Promise.all(arr)
                                .then((item )=>{
                                    return response.status(200).send({allparcel,item});
                                }).catch((error)=>{
                                    return db.rollback(() => {response.status(500).send(error)})
                                });
                            });
                        });
                    }).catch((error)=>{
                        if(error) return db.rollback(()=>{response.status(500).send(error)});
                        ////////////////////////////////////////
                        return response.status(500).send(error);
                    });
                });
            });
        });
    },

    uploadParcelImg:(request,response) => { 
        try {
            const path='/parcel'
            console.log('masuk upload')
            const upload = uploader.uploader(path, 'PARCEL').fields([{ name: 'image'}]);
            upload(request,response, (error) => {
                ///////////////////////////////////////////////////////////////////////////////////////////////
                if(error) return response.status(500).json({message:'upload foto gagal', error: error.message});
                //////////////////////////////
                const {image} = request.files;
                console.log(image)
                let imagePath = path + '/' + image[0].filename;
                response.status(200).send(imagePath);
            });
        } catch(error) {
            return response.status(500).send({message: error.message}+ "d");
        };
    },

    deleteParcelImg:(request,response) => {
        try {
            const {filePath} = request.body;
            fs.unlinkSync('./public' + filePath);
            response.status(200).send({message:"gambar dihapus"});
        } catch(error) {
            return response.status(500).send({message: error.message}+ "d");
        };
    },

    deleteParcel:(request,response) => {
        const {id} = request.body;
        console.log(id)
        let sql=`SELECT * FROM Parcel WHERE id=${db.escape(id)} AND isdeleted=0`;
        db.beginTransaction((error)=>{
            if(error) return response.status(500).send({message:error+"db transaction failed"});
            //////////////////////////////
            db.query(sql,(error,parcel)=>{
                if(error) return response.status(500).send("error delete a",error)
                ///////////////////////////////////////////////////////
                if(parcel[0].gambar.includes("http://localhost:8000")){
                    fs.unlinkSync("./public"+parcel[0].gambar.split("http://localhost:8000")[1]);
                };
                db.query(
                   `UPDATE parcel 
                    SET gambar="null", isdeleted=1 
                    WHERE id=${db.escape(parcel[0].id)} AND isdeleted=0`,
                    (error,result)=>{
                        if(error) return db.rollback(() => {response.status(500).send(error)})
                        ///////////////////////////
                        // console.log(result)
                        sql=`SELECT * FROM parcel WHERE isdeleted=0`
                        db.query(sql,(error,allparcel)=>{
                            if(error) return response.status(500).send({message:error});
                            //////////////////////
                            // console.log(allparcel)
                            let arr = [];
                            allparcel.forEach((val)=>{
                                arr.push(QueryProm(
                                    `SELECT * FROM parcel_has_categoryproduct
                                        WHERE parcel_id=${db.escape(val.id)}`
                                ))
                            });
                            Promise.all(arr).then((item)=>{
                                db.commit((error)=>{
                                    if(error) return db.rollback(() => {response.status(500).send(error)});
                                    ///////////////////////////////////////////////////
                                    // console.log(item)
                                    return response.status(200).send({allparcel,item});
                                });
                            }).catch((error)=>{
                                if(error) return db.rollback(()=>{response.status(500).send(error)});
                                ////////////////////////////////////////
                                // console.log(error)
                                return response.status(500).send(error);
                            });
                        });
                    }
                ); 
            });
        });
    },

    updateParcel:(request,response) => {
        const {nama, harga, categoryparcel_id, gambar, item, id} = request.body;
        console.log({nama, harga, categoryparcel_id, gambar, item, id});
        let sql = 
            `SELECT * 
             FROM Parcel 
             WHERE  id=${db.escape(id)} 
               AND  isdeleted=0
            `;
        try {
            db.beginTransaction((error)=>{
                if(error) return response.status(500).send({message:error+"db transaction on 'updateparcel' failed"});
                //////////////////////////////
                db.query(sql,(error,parcel)=>{
                    if(error) return response.status(500).send({message:error+'updateparcel A'});
                    ///////////////////////
                    // console.log(parcel[0]);
                    const updatedata = { nama, harga, categoryparcel_id, gambar };
                    sql = 
                        `UPDATE parcel 
                         SET ? 
                         WHERE id=${db.escape(parcel[0].id)} 
                        `;
                    db.query(sql,updatedata,(error)=>{
                        if(error) return response.status(500).send({message:error+'updateparcel B'});
                        /////////////////////////////////////////////////////////////////////////////
                        db.query(`SELECT * FROM parcel_has_categoryproduct WHERE parcel_id=${db.escape(id)}`, (error,parcel_items)=>{
                            if(error) return response.status(500).send({message:error+'updateparcel C'});
                            //////////////////////////////
                            // console.log(parcel_items);
                            let arrSql = [];
                            parcel_items.forEach((val)=>{
                                arrSql.push(
                                    QueryProm(
                                        `UPDATE parcel_has_categoryproduct
                                         SET qty=${item[item.findIndex(vals=> vals.categoryproduct_id === val.categoryproduct_id)].qty}
                                         WHERE categoryproduct_id=${db.escape(val.categoryproduct_id)} AND parcel_id=${db.escape(val.parcel_id)}
                                         `
                                    )
                                );
                            });
                            Promise.all(arrSql).then(()=>{
                                db.commit((error)=>{
                                    if(error) return db.rollback(() => {response.status(500).send(error)});
                                    //////////////////////////////////////////////////////////////////////
                                    db.query(`SELECT * FROM parcel WHERE isdeleted=0`,(error,allparcel)=>{
                                        if(error) return response.status(500).send({message:error});
                                        /////////////////////////
                                        // console.log(allparcel)
                                        arrSql = [];
                                        allparcel.forEach((val)=>{
                                            arrSql.push(QueryProm(
                                                `SELECT * 
                                                 FROM parcel_has_categoryproduct
                                                 WHERE parcel_id=${db.escape(val.id)}
                                                `
                                                )
                                            );
                                        });
                                        Promise.all(arrSql).then((item)=>{
                                            // console.log({allparcel,item})
                                            return response.status(200).send({allparcel,item});
                                        }).catch((error)=>{
                                            return db.rollback(() => {response.status(500).send(error)});
                                        });
                                    });
                                });
                            }).catch((error)=>{
                                return db.rollback(() => {response.status(500).send(error)});
                            });
                        });
                    });
                }) ;
            }); 
        } catch(error) {
            if(error) return db.rollback(()=>{response.status(500).send(error)});
            ////////////////////////////////////////
            // console.log(error)
            return response.status(500).send(error);
        };
    }
};

