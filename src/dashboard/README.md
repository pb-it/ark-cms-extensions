### Description

Add a dashboard to a model.

> At the moment the dashboard setup is possible only through code. 

Example code for returning an single note panel as dashboard: 
```js
const panels = [];
const controller = app.getController();
const obj = await controller.getDataService().fetchObjectById('posts', 1);
const model = controller.getModelController().getModel('note');
const mpcc = model.getModelPanelConfigController();
const panelConfig = mpcc.getPanelConfig(ActionEnum.read, DetailsEnum.title);
const panel = new NotePanel(panelConfig, obj, 'post');
panels.push(panel);
return Promise.resolve(panels);
```