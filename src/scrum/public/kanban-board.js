class KanbanBoard extends Panel {

    _data;
    _projects;
    _optionsProjects;
    _users;
    _optionsAssignee;
    _form;
    _items;

    _backlogColumn;
    _todoColumn;
    _inProgressColumn;
    _reviewColumn;
    _doneColumn;

    constructor(data) {
        super();
        if (data)
            this._data = data;
    }

    async _init() {
        await super._init();
        const controller = app.getController();
        try {
            const ds = controller.getDataService();
            if (!this._projects)
                this._projects = await ds.fetchData('projects');
            if (!this._optionsProjects) {
                this._optionsProjects = [];
                if (this._projects && this._projects.length > 0) {
                    for (var project of this._projects) {
                        this._optionsProjects.push({ 'value': project['name'] });
                    }
                }
            }
            if (!this._users)
                this._users = await ds.fetchData('_user');
            if (!this._optionsAssignee) {
                this._optionsAssignee = [];
                if (this._users && this._users.length > 0) {
                    for (var u of this._users) {
                        this._optionsAssignee.push({ 'value': u['username'] });
                    }
                }
            }

            this._items = [];
            var project;
            var userStoryIds;
            if (this._data && this._data['project']) {
                for (var p of this._projects) {
                    if (p['name'] == this._data['project']) {
                        project = p;
                        break;
                    }
                }
                if (project) {
                    if (!this._data || !this._data['artifacts'] || this._data['artifacts'].includes('tasks')) {
                        const us = await ds.fetchData('user-stories', null, 'project=' + project['id'], null, null, null, null, true);
                        userStoryIds = us.map(function (x) { return x['id'] });
                    }
                }
            }
            var assignee;
            if (this._data && this._data['assignee']) {
                for (var user of this._users) {
                    if (user['username'] == this._data['assignee']) {
                        assignee = user;
                        break;
                    }
                }
            }

            var where;
            if (!this._data || !this._data['artifacts'] || this._data['artifacts'].includes('tasks')) {
                if (userStoryIds)
                    where = 'user-story_in=' + userStoryIds.join(',');
                else
                    where = null;
                if (assignee) {
                    if (where)
                        where += '&assignee=' + assignee['id'];
                    else
                        where = 'assignee=' + assignee['id'];
                }
                var tasks = await ds.fetchData('tasks', null, where, null, null, null, null, true);
                if (tasks && tasks.length > 0) {
                    for (var task of tasks) {
                        this._items.push(new KanbanBoardItem({ 'bSelectable': true, 'bContextMenu': true }, new CrudObject('tasks', task)));
                    }
                }
            }
            if (!this._data || !this._data['artifacts'] || this._data['artifacts'].includes('defects')) {
                if (project)
                    where = 'project=' + project['id'];
                else
                    where = null;
                if (assignee) {
                    if (where)
                        where += '&assignee=' + assignee['id'];
                    else
                        where = 'assignee=' + assignee['id'];
                }
                const defects = await ds.fetchData('defects', null, where, null, null, null, null, true);
                if (defects && defects.length > 0) {
                    for (var defect of defects) {
                        this._items.push(new KanbanBoardItem({ 'bSelectable': true, 'bContextMenu': true }, new CrudObject('defects', defect)));
                    }
                }
            }
        } catch (error) {
            controller.showError(error);
        }
        return Promise.resolve();
    }

    async _renderContent() {
        const $div = $('<div/>')
            .css({ 'padding': '10' });

        for (var item of this._items) {
            item.dispose();
            item._$panel = $('<div/>')
                .addClass('panel')
                .hide();
        }

        $div.append('<h2>Filter</h2>');

        if (!this._form) {
            const skeleton = [
                {
                    name: 'project',
                    dataType: 'enumeration',
                    options: this._optionsProjects,
                    changeAction: async function (entry) {
                        this._data = await this._form.readForm();
                        this.render();
                        return Promise.resolve();
                    }.bind(this)
                },
                {
                    name: 'artifacts',
                    dataType: 'list',
                    options: [
                        { 'value': 'defects' },
                        { 'value': 'tasks' }
                    ],
                    changeAction: async function (entry) {
                        this._data = await this._form.readForm();
                        this.render();
                        return Promise.resolve();
                    }.bind(this)
                },
                {
                    name: 'assignee',
                    dataType: 'enumeration',
                    options: this._optionsAssignee,
                    changeAction: async function (entry) {
                        this._data = await this._form.readForm();
                        this.render();
                        return Promise.resolve();
                    }.bind(this)
                },
            ];
            if (!this._data)
                this._data = { 'artifacts': ['defects', 'tasks'] };
            this._form = new Form(skeleton, this._data);
        } else
            this._form.setFormData(this._data);
        const $form = await this._form.renderForm();
        $div.append($form);

        $div.append('<h2>Kanban-Board</h2>');

        const $table = $('<table>').addClass('kanban-board');
        var $row = $('<tr>');
        $row.append($('<th>').text('Backlog'));
        $row.append($('<th>').text('Open / To Do'));
        $row.append($('<th>').text('Work in Progress'));
        $row.append($('<th>').text('Test / Review'));
        $row.append($('<th>').text('Done'));
        $table.append($row);
        $row = $('<tr>');
        if (!this._backlogColumn)
            this._backlogColumn = new KanbanBoardColumn(this);
        this._backlogColumn.setItems(this._items.filter(function (x) { return !x._obj.getData()['state'] }));
        $row.append($('<td>').append(await this._backlogColumn.render('#ffb480')));
        if (!this._todoColumn)
            this._todoColumn = new KanbanBoardColumn(this, 'open');
        this._todoColumn.setItems(this._items.filter(function (x) { return x._obj.getData()['state'] == 'open' }));
        $row.append($('<td>').append(await this._todoColumn.render('#f8f38d')));
        if (!this._inProgressColumn)
            this._inProgressColumn = new KanbanBoardColumn(this, 'in progress');
        this._inProgressColumn.setItems(this._items.filter(function (x) { return x._obj.getData()['state'] == 'in progress' }));
        $row.append($('<td>').append(await this._inProgressColumn.render('#42d6a4')));
        if (!this._reviewColumn)
            this._reviewColumn = new KanbanBoardColumn(this, 'in review');
        this._reviewColumn.setItems(this._items.filter(function (x) { return x._obj.getData()['state'] == 'in review' }));
        $row.append($('<td>').append(await this._reviewColumn.render('#59adf6 ')));
        if (!this._doneColumn)
            this._doneColumn = new KanbanBoardColumn(this, 'closed');
        this._doneColumn.setItems(this._items.filter(function (x) { return x._obj.getData()['state'] == 'closed' }));
        $row.append($('<td>').append(await this._doneColumn.render('#c780e8')));
        $table.append($row);
        $div.append($table);

        const $footer = $('<div/>')
            .addClass('clear');
        $div.append($footer);

        return Promise.resolve($div);
    }

    async apply(typeString, id, state) {
        const items = this._items.filter(function (x) { return x._obj.getTypeString() === typeString && x._obj.getData()['id'] == id });
        if (items.length == 1) {
            const obj = items[0]._obj;
            /*const data = obj.getData();
            data['state'] = state;
            obj.setData(data);*/
            await obj.update({ 'state': state });
        }
        return this.render();
    }
}