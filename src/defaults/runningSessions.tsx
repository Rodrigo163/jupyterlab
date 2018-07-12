import * as React from 'react';
import { IconItem } from '../component/icon';

import {
    JupyterLabPlugin,
    JupyterLab,
    ApplicationShell
} from '@jupyterlab/application';
import { IDefaultStatusesManager } from './manager';
import {
    ServiceManager,
    Kernel,
    TerminalSession,
    TerminalManager,
    SessionManager
} from '@jupyterlab/services';
import { VDomRenderer } from '@jupyterlab/apputils';
import { Signal, ISignal } from '@phosphor/signaling';
import { IDisposable } from '@phosphor/disposable';
import { Token } from '@phosphor/coreutils';

// tslint:disable-next-line:variable-name
const RunningSessionsComponent = (
    props: RunningSessionsComponent.IProps
): React.ReactElement<RunningSessionsComponent.IProps> => {
    return (
        <div onClick={props.handleClick}>
            <div className={'text-item'}>{props.kernels}</div>
            <IconItem source={'kernel-item'} />
            <div className={'text-item'}>{props.terminals}</div>
            <IconItem source={'terminal-item'} />
        </div>
    );
};

namespace RunningSessionsComponent {
    export interface IProps {
        handleClick: () => void;
        kernels: number;
        terminals: number;
    }
}

class RunningSessions extends VDomRenderer<RunningSessions.Model>
    implements IRunningSessions {
    constructor(opts: RunningSessions.IOptions) {
        super();
        this._serviceManager = opts.serviceManager;
        this._host = opts.host;

        this._serviceManager.sessions.runningChanged.connect(
            this._onKernelsRunningChanged
        );
        this._serviceManager.terminals.runningChanged.connect(
            this._onTerminalsRunningChanged
        );

        this.model = new RunningSessions.Model();
    }

    render() {
        return (
            <RunningSessionsComponent
                kernels={this.model!.kernels}
                terminals={this.model!.terminals}
                handleClick={this._handleItemClick}
            />
        );
    }

    private _onKernelsRunningChanged = (
        manager: SessionManager,
        kernels: Kernel.IModel[]
    ) => {
        this.model!.kernels = kernels.length;
    };

    private _onTerminalsRunningChanged = (
        manager: TerminalManager,
        terminals: TerminalSession.IModel[]
    ) => {
        this.model!.terminals = terminals.length;
    };

    private _handleItemClick = () => {
        this._host.expandLeft();
        this._host.activateById('jp-running-sessions');
    };

    private _host: ApplicationShell;
    private _serviceManager: ServiceManager;
}

namespace RunningSessions {
    export class Model implements VDomRenderer.IModel, IRunningSessions.IModel {
        get kernels() {
            return this._kernels;
        }

        set kernels(kernels: number) {
            this._kernels = kernels;
            this._stateChanged.emit(void 0);
        }

        get terminals() {
            return this._terminals;
        }

        set terminals(terminals: number) {
            this._terminals = terminals;
            this._stateChanged.emit(void 0);
        }

        get stateChanged() {
            return this._stateChanged;
        }

        get isDisposed() {
            return this._isDisposed;
        }

        dispose() {
            if (this._isDisposed) {
                return;
            }

            Signal.clearData(this);
        }

        private _terminals: number = 0;
        private _kernels: number = 0;

        private _isDisposed: boolean = false;
        private _stateChanged: Signal<this, void> = new Signal(this);
    }

    export interface IOptions {
        host: ApplicationShell;
        serviceManager: ServiceManager;
    }
}

export interface IRunningSessions extends IDisposable {
    readonly model: IRunningSessions.IModel | null;
    readonly modelChanged: ISignal<this, void>;
}

export namespace IRunningSessions {
    export interface IModel {
        terminals: number;
        kernels: number;
    }
}

// tslint:disable-next-line:variable-name
export const IRunningSessions = new Token<IRunningSessions>(
    'jupyterlab-statusbar/IRunningSessions'
);

/*
 * Initialization data for the statusbar extension.
 */
export const runningSessionsItem: JupyterLabPlugin<IRunningSessions> = {
    id: 'jupyterlab-statusbar/default-items:running-sessions',
    autoStart: true,
    provides: IRunningSessions,
    requires: [IDefaultStatusesManager],
    activate: (app: JupyterLab, manager: IDefaultStatusesManager) => {
        const item = new RunningSessions({
            host: app.shell,
            serviceManager: app.serviceManager
        });

        manager.addDefaultStatus('running-sessions-item', item, {
            align: 'left'
        });

        return item;
    }
};
