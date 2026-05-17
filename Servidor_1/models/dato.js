const { Schema, model } = require('mongoose');

const DatoSchema = Schema({
    dispositivo_uuid: {
        type: String,
        required: [true, 'El UUID del dispositivo es obligatorio'],
        ref: 'Dispositivo'
    },
    sensor1: {
        type: Number,
        default: null
    },
    sensor2: {
        type: Number,
        default: null
    },
    sensor3: {
        type: Number,
        default: null
    },
    sensor4: {
        type: Number,
        default: null
    },
    fecha_insercion: {
        type: Date,
        default: Date.now
    }
});

DatoSchema.methods.toJSON = function() {
    const { __v, _id, ...dato } = this.toObject();
    return dato;
}

module.exports = model('Dato', DatoSchema);
