/*
  This program is free software: you can redistribute it and/or modify
  it under the terms of the GNU General Public License as published by
  the Free Software Foundation, either version 3 of the License, or
  (at your option) any later version.

  This program is distributed in the hope that it will be useful,
  but WITHOUT ANY WARRANTY; without even the implied warranty of
  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
  GNU General Public License for more details.

  You should have received a copy of the GNU General Public License
  along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/
    
// Check if document requirements are met
var requirementsMet = false;

if (app.documents.length > 0){
  if (app.activeDocument.layers.length > 0){
    if (app.activeDocument.mode == DocumentMode.RGB) {  
      requirementsMet = true;
    }
  }
}

if (requirementsMet){
  // Detrmines how many channels will be created per tone  
  maxChannels = 4;  
  currentDoc = app.activeDocument;
  lightChannels = [];
  darkChannels = [];
  midtonesChannels = [];
  
  openLuminosityMasksParamsDialog();
  //createLuminosityMasks ();  
}
else{
  alert("To execute this script there must be one (and only one) selected layer on an RGB type document.");
}

function openLuminosityMasksParamsDialog() {  
  var win, windowResource;
  
  w = new Window("dialog", "Luminosity masks creation");  
  
  var panelParams = w.add("panel", undefined, "Parameters");
  panelParams.orientation = "column";
  panelParams.alignChildren = "left";
  
  var groupLevels = panelParams.add("group");
  //groupLevels.alignCh = "left";
  groupLevels.orientation = "row";  
  groupLevels.add("statictext", undefined, "Number of channels created per tone (4 recommended):");
  
  var levelsDropdown = groupLevels.add ("dropdownlist", undefined, ["1", "2", "3", "4", "5"]);
  levelsDropdown.selection = 3;
  
  var checkCurvesLayersCreation = panelParams.add ("checkbox", undefined, "Add curves adjustment layers based on luminosity masks");
  checkCurvesLayersCreation.value = true;
  
  var groupBottom = w.add("group");  
  groupBottom.alignment = "right";
  
  var buttonOk = groupBottom.add ("button", undefined, "Ok");
  var buttonCancel = groupBottom.add ("button", undefined, "Cancel");   
  
  buttonOk.onClick = function() {      
    w.close();
    createLuminosityMasks (parseInt(levelsDropdown.selection.text), checkCurvesLayersCreation.value);  
    return;
  };
  buttonCancel.onClick = function() {    
    return w.close();
  };  

  w.show();
}

function createLuminosityMasks(selectedDepth, createCurves) {
  maxChannels = selectedDepth;
  
  // Deselect all, just in case
  currentDoc.selection.deselect();
  
  // First selection based on RGB channel
  selectFromRGBChannel();    

  // Create luminosity channels
  for (i=0; i<maxChannels; i++) {
    createNewLuminosityChannel("Lights", i, lightChannels);
    
    // Loads new selection based on the intersection with current created channel
    currentDoc.selection.load(newChannel, SelectionType.INTERSECT);
  }

  // Load selection based on first  Lights channel and invert it
  currentDoc.selection.load(lightChannels[0]);
  currentDoc.selection.invert();
  
  for (i=0; i<maxChannels; i++) {
    createNewLuminosityChannel("Darks", i, darkChannels);
    
    // Loads new selection based on the intersection with current created channel
    currentDoc.selection.load(newChannel, SelectionType.INTERSECT);
  }

  currentDoc.selection.selectAll();
  
  // Create midtones channels
  for (i=0; i<maxChannels; i++) {
    // Select all  
    currentDoc.selection.selectAll();
    
    // Substract corresponding light and dark channels from selection
    currentDoc.selection.load(lightChannels[i], SelectionType.DIMINISH);
    currentDoc.selection.load(darkChannels[i], SelectionType.DIMINISH);
    
    createNewLuminosityChannel("Midtones", i, midtonesChannels);
  }
  
  if (createCurves) {
    // Create curves adjustment layers based on created channels
    createCurvesSet("Lights", lightChannels);
    createCurvesSet("Midtones", midtonesChannels);
    createCurvesSet("Darks", darkChannels);
  }
  
  // Select nothing when finished
  currentDoc.selection.deselect();
  
  alert("Luminosity masks created!");
}

function createCurvesSet(setName, arr){
  ls = currentDoc.layerSets.add();
  ls.name = setName + " curves";
  
  for (i=0; i<arr.length; i++) {
    currentDoc.selection.load(arr[i]);
    CreateCurvesLayer(ls.name, setName + " " + i);
  }
}

function createNewLuminosityChannel(prefix, idx, arr) {
  // Creates new channel based on current selection  
  newChannel = currentDoc.channels.add();
  newChannel.name = prefix + " " + idx;
  currentDoc.selection.store(newChannel);
  
  // Add new channel to array
  arr[arr.length] = newChannel;
}

// This is like doing CTRL+click on the combined RGB Channel
// Don't know how to do it with pure ExtendScript and I'm not sure it will work with other languages other than English
function selectFromRGBChannel() {
    var idsetd = charIDToTypeID( "setd" );
    var desc11 = new ActionDescriptor();
    var idnull = charIDToTypeID( "null" );
        var ref10 = new ActionReference();
        var idChnl = charIDToTypeID( "Chnl" );
        var idfsel = charIDToTypeID( "fsel" );
        ref10.putProperty( idChnl, idfsel );
    desc11.putReference( idnull, ref10 );
    var idT = charIDToTypeID( "T   " );
        var ref11 = new ActionReference();
        var idChnl = charIDToTypeID( "Chnl" );
        var idChnl = charIDToTypeID( "Chnl" );
        var idRGB = charIDToTypeID( "RGB " );
        ref11.putEnumerated( idChnl, idChnl, idRGB );
    desc11.putReference( idT, ref11 );
    executeAction( idsetd, desc11, DialogModes.NO );
}

function CreateCurvesLayer(setName, layerName){
    // ====================== SELECT LAYER SET  =================================
    var idslct = charIDToTypeID( "slct" );
        var desc314 = new ActionDescriptor();
        var idnull = charIDToTypeID( "null" );
            var ref333 = new ActionReference();
            var idLyr = charIDToTypeID( "Lyr " );
            ref333.putName( idLyr, setName);
        desc314.putReference( idnull, ref333 );
        var idMkVs = charIDToTypeID( "MkVs" );
        desc314.putBoolean( idMkVs, false );
    executeAction( idslct, desc314, DialogModes.NO );

    // ==================== CREATE CURVES LAYER WITH GIVEN NAME ===================================   
    var idMk = charIDToTypeID( "Mk  " );
    var desc448 = new ActionDescriptor();
    var idnull = charIDToTypeID( "null" );
        var ref503 = new ActionReference();
        var idAdjL = charIDToTypeID( "AdjL" );
        ref503.putClass( idAdjL );
    desc448.putReference( idnull, ref503 );
    var idUsng = charIDToTypeID( "Usng" );
        var desc449 = new ActionDescriptor();
        var idNm = charIDToTypeID( "Nm  " );
        desc449.putString( idNm, layerName);
        var idType = charIDToTypeID( "Type" );
            var desc450 = new ActionDescriptor();
            var idpresetKind = stringIDToTypeID( "presetKind" );
            var idpresetKindType = stringIDToTypeID( "presetKindType" );
            var idpresetKindDefault = stringIDToTypeID( "presetKindDefault" );
            desc450.putEnumerated( idpresetKind, idpresetKindType, idpresetKindDefault );
        var idCrvs = charIDToTypeID( "Crvs" );
        desc449.putObject( idType, idCrvs, desc450 );
    var idAdjL = charIDToTypeID( "AdjL" );
    desc448.putObject( idUsng, idAdjL, desc449 );
executeAction( idMk, desc448, DialogModes.NO );
}