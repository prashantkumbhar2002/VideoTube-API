import mongoose from "mongoose";

const orderItemsSchema = new mongoose.Schema({
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product"
    },
    quantity: {
        type: Number,
        required: true
    },

})

const orderSchema = new mongoose.Schema(
    {
        orderPrice: {
            type: Number,
            required: true
        },
        customer: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },
        orderItems: {
            type: [orderItemsSchema]                    // passing Schema As the type here
        },

        // orderItems: {
        //     type: [
        //         {
        //             product: {
        //                 type: mongoose.Schema.Types.ObjectId,
        //                 ref: "Product"
        //             },
        //             quantity: {
        //                 type: Number,
        //                 required: true
        //             }
        //         }
        //     ]
        // },

        address: {
            type: String,
            required: true
        },
        status: {
            type: String,
            enum: ["PENDING","CANCELLED","DELIVERED"],       //use of enum so that user can choose from the given values
            default: "PENDING"
        }
    }, 
    { timestamps: true }
);

export const Order = mongoose.model("Order", orderSchema);
