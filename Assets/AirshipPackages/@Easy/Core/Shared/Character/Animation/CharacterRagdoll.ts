import { Airship } from "../../Airship";
import { Game } from "../../Game";
import { Binding } from "../../Input/Binding";

export default class CharacterRagdoll extends AirshipBehaviour {
	public startOn = false;
	public interpolationMode = RigidbodyInterpolation.None;
	public collisionDetectionMode = CollisionDetectionMode.Discrete;

	private colliders: Collider[] = [];
	private rigids: Rigidbody[] = [];
	private joints: CharacterJoint[] = [];
	private rig: CharacterRig;
	private anim: Animator;
	private ragdollEnabled = false;

	protected Awake(): void {
		this.rig = this.gameObject.GetComponent<CharacterRig>()!;
		if (!this.rig) {
			error("CharacterRagdoll component must be on the same object as the CharacterRig");
		}
		this.anim = this.gameObject.GetComponent<Animator>()!;
		const foundJoints = this.gameObject.GetComponentsInChildren<CharacterJoint>();
		for (let i = 0; i < foundJoints.Length; i++) {
			let joint = foundJoints.GetValue(i);
			if (joint) {
				let go = joint.gameObject;
				this.joints.push(joint);
				this.colliders.push(go.GetComponent<Collider>()!);
				this.rigids.push(go.GetComponent<Rigidbody>()!);
			}
		}

		const TEST = false;
		if (TEST) {
			Airship.Input.CreateAction("TEST", Binding.Key(Key.F));
			Airship.Input.OnDown("TEST").Connect(() => {
				this.SetRagdoll(!this.ragdollEnabled);
				this.AddGlobalForce(
					Game.localPlayer.character?.movement?.GetVelocity().mul(3) ?? Vector3.zero,
					ForceMode.Impulse,
				);
				this.AddExplosiveForce(
					math.random(20, 40),
					new Vector3(math.random() - 0.5, math.random() - 0.5, math.random() - 0.5).add(
						Game.localPlayer.character?.transform.position ?? Vector3.zero,
					),
					2,
					1 + math.random() * 2,
					ForceMode.Impulse,
				);
			});
		}
	}

	protected Start(): void {
		this.ragdollEnabled = !this.startOn;
		this.SetRagdoll(this.startOn);
	}

	public SetRagdoll(ragdollOn: boolean) {
		if (this.ragdollEnabled === ragdollOn) {
			return;
		}

		this.ragdollEnabled = ragdollOn;
		//Toggle animator
		if (this.anim) {
			this.anim.enabled = !ragdollOn;
		}
		//Toggle physics objects
		for (let i = 0; i < this.joints.size(); i++) {
			//Have to set collision mode to Discrete with going kinematic otherwise Unity throws an error
			this.rigids[i].collisionDetectionMode = ragdollOn
				? this.collisionDetectionMode
				: CollisionDetectionMode.Discrete;
			this.rigids[i].interpolation = ragdollOn ? this.interpolationMode : RigidbodyInterpolation.None;
			this.rigids[i].isKinematic = !ragdollOn;
			this.colliders[i].enabled = ragdollOn;
		}

		//Make sure skinned meshes still render even when thrown far from origin
		const renderers = this.gameObject.GetComponentsInChildren<SkinnedMeshRenderer>();
		for (let i = 0; i < renderers.Length; i++) {
			renderers.GetValue(i).updateWhenOffscreen = ragdollOn;
		}
	}

	public AddGlobalForce(force: Vector3, mode: ForceMode) {
		if (!this.ragdollEnabled) {
			return;
		}

		for (let i = 0; i < this.joints.size(); i++) {
			this.rigids[i].AddForce(force, mode);
		}
	}

	public AddExplosiveForce(
		explosionForce: number,
		explosionPosition: Vector3,
		explosionRadius: number,
		upwardsModifier: number,
		mode: ForceMode,
	) {
		if (!this.ragdollEnabled) {
			return;
		}

		for (let i = 0; i < this.joints.size(); i++) {
			this.rigids[i].AddExplosionForce(explosionForce, explosionPosition, explosionRadius, upwardsModifier, mode);
		}
	}
}
