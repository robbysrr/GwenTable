import unittest,json,pathlib
P=pathlib.Path(__file__).parent
D=json.loads((P/'spell_delta_v143.json').read_text()); R=D['records']; N={r['name_en']:r for r in R}; C={n:r['reference_checks'] for n,r in N.items()}
B=json.loads((P/'spell_delta_v142.json').read_text()); M=json.loads((P/'spell_combined_v142_v143.json').read_text())
class Delta(unittest.TestCase):
 def test_ordinals(self): self.assertEqual([r['ordinal'] for r in R],list(range(157,169)))
 def test_names_levels(self): self.assertEqual([(r['name_en'],r['level']) for r in R],[('Heal',6),('Healing Word',1),('Heat Metal',2),('Hellish Rebuke',1),('Heroes’ Feast',6),('Heroism',1),('Hex',1),('Hideous Laughter',1),('Hold Monster',5),('Hold Person',2),('Holy Aura',8),('Hunter’s Mark',1)])
 def test_pages(self): self.assertEqual([r['source']['printed_pages'] for r in R],[[139],[139],[139,140],[140],[140],[140],[140],[140],[140,141],[141],[141],[141]])
 def test_schema(self): self.assertTrue(all(set(r)==set(B['records'][0]) for r in R))
 def test_release(self): self.assertTrue(all(r['release_status']=='NO_GO' and r['editorial_status']=='PENDING' and r['integration_status']=='NOT_VERIFIED' for r in R));self.assertFalse(M['parent_merge_verified'])
 def test_components(self):
  for r in R: self.assertEqual('M' in r['components'],r['material'] is not None);self.assertTrue(set(r['components'])<=set('VSM'))
 def test_concentration(self): self.assertEqual({r['name_en'] for r in R if r['concentration']},{'Heat Metal','Heroism','Hex','Hideous Laughter','Hold Monster','Hold Person','Holy Aura','Hunter’s Mark'});self.assertTrue(all(r['concentration']==r['duration'].startswith('Concentration') for r in R))
 def test_material(self): self.assertEqual({r['name_en']:(r['material']['minimum_gp'],r['material']['consumed']) for r in R if r['material'] and r['material']['minimum_gp']},{'Heroes’ Feast':(1000,True),'Holy Aura':(1000,False)})
 def test_license(self): self.assertEqual(D['attribution'],B['attribution']);self.assertIn(D['attribution'],(P/'SPELL_LOCALIZATION_v143.md').read_text())
 def test_md(self):
  md=(P/'SPELL_LOCALIZATION_v143.md').read_text()
  for r in R:self.assertIn(f"## {r['ordinal']}. {r['name_en']}",md);self.assertIn(r['description_id'],md)
 def test_parent_preservation(self): self.assertEqual(M['records'][:12],B['records']); self.assertEqual(M['records'][12:],R)
 def test_combined(self): self.assertEqual([r['ordinal'] for r in M['records']],list(range(145,169)));self.assertEqual(len({r['name_en'] for r in M['records']}),24)
 def test_heal(self): self.assertEqual((C['Heal']['heal_hp'],C['Heal']['upcast_hp_per_slot']),(70,10));self.assertEqual(C['Heal']['ends_conditions'],['Blinded','Deafened','Poisoned'])
 def test_healing_word(self): self.assertEqual((C['Healing Word']['heal_dice'],C['Healing Word']['upcast_dice_per_slot']),('2d4','2d4'));self.assertEqual(N['Healing Word']['casting_time'],'Bonus Action')
 def test_heat_metal(self): self.assertTrue(C['Heat Metal']['repeat_object_in_range']);self.assertEqual(C['Heat Metal']['penalty_deadline'],'start_of_caster_next_turn');self.assertEqual(C['Heat Metal']['save'],'Constitution')
 def test_rebuke(self): self.assertEqual(C['Hellish Rebuke']['trigger_range_ft'],60);self.assertEqual(C['Hellish Rebuke']['success_damage_multiplier'],0.5)
 def test_feast(self): self.assertEqual((C['Heroes’ Feast']['max_participants'],C['Heroes’ Feast']['meal_hours'],C['Heroes’ Feast']['benefit_duration_hours']),(12,1,24));self.assertEqual(C['Heroes’ Feast']['hp_max_increase'],'2d10')
 def test_heroism(self): self.assertEqual(C['Heroism']['temporary_hp_trigger'],'start_of_each_target_turn');self.assertTrue(C['Heroism']['target_willing'])
 def test_hex(self): self.assertEqual(C['Hex']['disadvantage_scope'],'chosen_ability_checks');self.assertEqual(C['Hex']['concentration_hours_by_slot'],{'1':1,'2':4,'3-4':8,'5+':24});self.assertEqual(C['Hex']['retarget_timing'],'later_turn')
 def test_laughter(self): self.assertEqual(C['Hideous Laughter']['advantage_trigger'],'damage_triggered_save');self.assertEqual(C['Hideous Laughter']['failure_conditions'],['Prone','Incapacitated'])
 def test_hold(self): self.assertEqual((C['Hold Person']['target_type'],C['Hold Monster']['target_type']),('Humanoid','Creature'));self.assertTrue(all(C[n]['repeat_success']=='ends_on_self' for n in ('Hold Person','Hold Monster')))
 def test_aura(self): self.assertEqual(C['Holy Aura']['retaliation_attacker_types'],['Fiend','Undead']);self.assertEqual(C['Holy Aura']['retaliation_trigger'],'melee_attack_roll_hit')
 def test_mark(self): self.assertEqual(C['Hunter’s Mark']['damage_type'],'Force');self.assertEqual(C['Hunter’s Mark']['concentration_hours_by_slot'],{'1-2':1,'3-4':8,'5+':24});self.assertTrue(C['Hunter’s Mark']['new_target_visible'])
 def test_fields(self): self.assertEqual(sum(len(r['reference_checks']) for r in R),103);self.assertEqual(sum(len(r['reference_checks']) for r in M['records']),217)
if __name__=='__main__':unittest.main(verbosity=2)
