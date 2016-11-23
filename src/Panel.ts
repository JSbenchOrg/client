import Promise = Q.Promise;

export interface Panel {
    getData(): Promise<any>;
    render(data: any): void;
}
