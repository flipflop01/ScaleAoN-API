"use strict";

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const projectSchema = new mongoose.Schema({
    projectName: String,
    items: [{type: String}],
    tasks: [{type: String}]
});


const Project = mongoose.model('Project', projectSchema);

module.exports = Project;
