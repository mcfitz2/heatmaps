var mongoose = require('mongoose');
var HeatmapSchema = mongoose.Schema({
    owner: [{type: mongoose.Schema.Types.ObjectId, ref: 'User'}],
    points: [],
    splits: [] 
});

var Heatmap = mongoose.model("Heatmap", HeatmapSchema);
module.exports = Heatmap;