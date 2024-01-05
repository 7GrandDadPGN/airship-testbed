/// <reference types="@easy-games/types" />
/// <reference types="@easy-games/types" />
export declare class LocalEntityInputSignal {
    moveDirection: Vector3;
    jump: boolean;
    sprinting: boolean;
    crouchOrSlide: boolean;
    constructor(moveDirection: Vector3, jump: boolean, sprinting: boolean, crouchOrSlide: boolean);
}
