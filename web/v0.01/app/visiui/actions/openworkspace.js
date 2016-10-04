
hax.app.visiui.openworkspace = {};

//=====================================
// UI Entry Point
//=====================================

hax.app.visiui.openworkspace.getOpenCallback = function(app) {
    return function() {
    
        var onOpen = function(workspaceData) {
                
            var actionCompletedCallback = function(actionResponse) {
                if(!actionResponse.getSuccess()) {
                    alert(actionResponse.getErrorMsg());
                }
            };
            
            //open workspace
            hax.app.visiui.openworkspace.openWorkspace(app,workspaceData,actionCompletedCallback);

            //we should show some sort of loading message or symbol
            return true;
        }
        
        hax.app.visiui.dialog.showOpenWorkspaceDialog(onOpen);
    }
}

//=====================================
// Action
//=====================================


/** This method opens an workspace, from the text file. 
 * The result is returnd through the callback function rather than a return value,
 * since the function runs (or may run) asynchronously. */
hax.app.visiui.openworkspace.openWorkspace = function(app,workspaceText,actionCompletedCallback) {
    var actionResponse = new hax.core.ActionResponse();
    var name;
    var workspaceUIAdded;
    
    try {
        //parse the workspace json
        var workspaceJson = JSON.parse(workspaceText);

//I should verify the file type and format!    

		//make a blank workspace
        name = workspaceJson.workspace.name;
        
        var workspaceUI = new hax.app.visiui.WorkspaceUI();
        workspaceUIAdded = app.addWorkspaceUI(workspaceUI,name);
    
        //add links, if applicable
		var jsLinks;
		var cssLinks;
        var linksAdded = false;
        if((workspaceJson.jsLinks)&&(workspaceJson.jsLinks.length > 0)) {
            jsLinks = workspaceJson.jsLinks;
            linksAdded = true;
        }
		else {
			jsLinks = [];
		}
        if((workspaceJson.cssLinks)&&(workspaceJson.cssLinks.length > 0)) {
			cssLinks = workspaceJson.cssLinks;
            linksAdded = true;
        }
		else {
			cssLinks = [];
		}
    	
		//if we have to load links wait for them to load
		var doWorkspaceLoad = function() {
            hax.app.visiui.openworkspace.loadWorkspace(workspaceUI,workspaceJson);
            actionCompletedCallback(actionResponse);
        }
        
        if(linksAdded) {
			//set links and set the callback to complete loading the workspace
			workspaceUI.setLinks(jsLinks,cssLinks,doWorkspaceLoad,name);
		}
		else {
			//immediately load the workspace - no links to wait for
            doWorkspaceLoad();
		}
    }
    catch(error) {
        if(workspaceUIAdded) {
            app.removeWorkspaceUI(name);
        }
        var actionError = hax.core.ActionError.processException(error,"AppException",false);
        actionResponse.addError(actionError);
        actionCompletedCallback(actionResponse);
    }
}

/** This method loads an existing workspace into an empty workspace UI. */
hax.app.visiui.openworkspace.loadWorkspace = function(workspaceUI,workspaceJson,actionResponse) {
    var workspaceDataJson = workspaceJson.workspace;
    var workspaceComponentsJson = workspaceJson.components;

    var workspace = new hax.core.Workspace(workspaceDataJson,actionResponse);
    
    workspaceUI.setWorkspace(workspace,workspaceComponentsJson);
}


//------------------------
// open from url
//------------------------

/** This method opens an workspace by getting the workspace file from the url. */
hax.app.visiui.openworkspace.openWorkspaceFromUrl = function(app,url) {
    var actionCompletedCallback = function(actionResponse) {
        if(!actionResponse.getSuccess()) {
            alert(actionResponse.getErrorMsg());
        }
    };
    
    hax.app.visiui.openworkspace.openWorkspaceFromUrlImpl(app,url,actionCompletedCallback);
}

/** This method opens an workspace by getting the workspace file from the url. */
hax.app.visiui.openworkspace.openWorkspaceFromUrlImpl = function(app,url,actionCompletedCallback) {
    var onDownload = function(workspaceText) {
        hax.app.visiui.openworkspace.openWorkspace(app,workspaceText,actionCompletedCallback);
    }
    
    var onFailure = function(msg) {
        var actionError = new hax.core.ActionError(msg,"AppException",null);
        var actionResponse = new hax.core.ActionResponse();
        actionResponse.addError(actionError);
        actionCompletedCallback(actionResponse);
    }   
    hax.app.visiui.openworkspace.doRequest(url,onDownload,onFailure);   
}

/**
 * This is an http request for the worksheet data
 */
hax.app.visiui.openworkspace.doRequest= function(url,onDownload,onFailure) {
	var xmlhttp=new XMLHttpRequest();

    xmlhttp.onreadystatechange=function() {
        var msg;
        if (xmlhttp.readyState==4 && xmlhttp.status==200) {
            onDownload(xmlhttp.responseText);
        }
        else if(xmlhttp.readyState==4  && xmlhttp.status >= 400)  {
            msg = "Error in http request. Status: " + xmlhttp.status;
            onFailure(msg);
        }
    }
	
	xmlhttp.open("GET",url,true);
    xmlhttp.send();
}