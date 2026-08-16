import {
  AddPlayerForm,
  CompositionWarning,
  DerivedRoleCounter,
  PlayerList,
  RoleCounter,
  RoleCounterList,
  SetupScreen,
  SetupSection,
  SetupSectionTitle,
  SetupTitle,
  StartGameButton,
} from "src/components/setup/setup.ui";
import { RoleId } from "src/lib/game/types";
import type { Dictionary } from "src/lib/i18n/types";

interface SetupProps {
  /** Every string this screen renders, in the active language. */
  dict: Dictionary;
}

/**
 * The setup screen: who is at the table and which cards they will be dealt.
 * @param props.dict - Copy for the active language.
 * @returns The composed setup screen.
 */
export function Setup({ dict }: SetupProps) {
  return (
    <SetupScreen>
      <SetupTitle>{dict.setup.title}</SetupTitle>

      <AddPlayerForm inputLabel={dict.setup.addPlayerPlaceholder}>
        {dict.setup.addPlayer}
      </AddPlayerForm>

      <SetupSection>
        <SetupSectionTitle>{dict.common.players}</SetupSectionTitle>
        <PlayerList removeLabel={dict.setup.removePlayer} />
      </SetupSection>

      <SetupSection>
        <SetupSectionTitle>{dict.setup.roleCompositionTitle}</SetupSectionTitle>
        <RoleCounterList>
          {Object.values(RoleId).map((role) =>
            // The engine backfills villagers, so that row is a readout, not a control.
            role === RoleId.Villager ? (
              <DerivedRoleCounter
                key={role}
                role={role}
                label={dict.roles[role].name}
                note={dict.setup.villagerAuto}
              >
                {dict.roles[role].description}
              </DerivedRoleCounter>
            ) : (
              <RoleCounter
                key={role}
                role={role}
                label={dict.roles[role].name}
                decreaseLabel={dict.setup.decreaseRole}
                increaseLabel={dict.setup.increaseRole}
              >
                {dict.roles[role].description}
              </RoleCounter>
            ),
          )}
        </RoleCounterList>
      </SetupSection>

      <CompositionWarning
        tooFewTemplate={dict.setup.tooFewRoles}
        tooManyTemplate={dict.setup.tooManyRoles}
      />

      <StartGameButton>{dict.setup.startGame}</StartGameButton>
    </SetupScreen>
  );
}
