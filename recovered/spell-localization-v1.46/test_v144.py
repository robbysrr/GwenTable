import unittest,json,pathlib
P=pathlib.Path(__file__).parent
D=json.loads((P/'spell_delta_v144.json').read_text()); R=D['records']; N={r['name_en']:r for r in R}; C={n:r['reference_checks'] for n,r in N.items()}
B=json.loads((P/'spell_combined_v142_v143.json').read_text()); M=json.loads((P/'spell_combined_v142_v144.json').read_text())
class Delta144(unittest.TestCase):
 def test_ordinals(self):self.assertEqual([r['ordinal'] for r in R],list(range(169,181)))
 def test_names_levels(self):self.assertEqual([(r['name_en'],r['level']) for r in R],[('Hypnotic Pattern',3),('Ice Knife',1),('Ice Storm',4),('Identify',1),('Illusory Script',1),('Imprisonment',9),('Incendiary Cloud',8),('Inflict Wounds',1),('Insect Plague',5),('Instant Summons',6),('Irresistible Dance',6),('Invisibility',2)])
 def test_pages(self):self.assertEqual([r['source']['printed_pages'] for r in R],[[141],[141],[141,142],[142],[142],[142],[142,143],[143],[143],[143],[143],[143]])
 def test_metadata(self):
  for r in R:self.assertEqual(set(r),set(B['records'][0]));self.assertEqual(r['source']['url'],D['source_url']);self.assertEqual(r['source']['anchor'],r['name_en'])
 def test_release(self):self.assertTrue(all(r['editorial_status']=='PENDING' and r['integration_status']=='NOT_VERIFIED' and r['release_status']=='NO_GO' for r in R));self.assertFalse(M['parent_merge_verified'])
 def test_components(self):
  for r in R:self.assertEqual('M' in r['components'],r['material'] is not None);self.assertTrue(set(r['components'])<=set('VSM'))
 def test_materials(self):self.assertEqual({r['name_en']:(r['material']['minimum_gp'],r['material']['consumed']) for r in R if r['material'] and r['material']['minimum_gp']},{'Identify':(100,False),'Illusory Script':(10,True),'Imprisonment':(5000,False),'Instant Summons':(1000,False)})
 def test_concentration(self):self.assertEqual({r['name_en'] for r in R if r['concentration']},{'Hypnotic Pattern','Incendiary Cloud','Insect Plague','Irresistible Dance','Invisibility'});self.assertTrue(all(r['concentration']==r['duration'].startswith('Concentration') for r in R))
 def test_rituals(self):self.assertEqual({r['name_en'] for r in R if 'Ritual' in r['casting_time']},{'Identify','Illusory Script','Instant Summons'})
 def test_license(self):self.assertEqual(D['attribution'],B['attribution']);self.assertIn(D['attribution'],(P/'SPELL_LOCALIZATION_v144.md').read_text())
 def test_markdown(self):
  md=(P/'SPELL_LOCALIZATION_v144.md').read_text()
  for r in R:self.assertIn(f"## {r['ordinal']}. {r['name_en']}",md);self.assertIn(r['description_id'],md)
 def test_preserve_parent(self):self.assertEqual(M['records'][:24],B['records']);self.assertEqual(M['records'][24:],R)
 def test_combined(self):self.assertEqual([r['ordinal'] for r in M['records']],list(range(145,181)));self.assertEqual(len({r['name_en'] for r in M['records']}),36)
 def test_hypnotic(self):self.assertEqual(C['Hypnotic Pattern']['speed_while_charmed'],0);self.assertTrue(C['Hypnotic Pattern']['target_must_see_pattern']);self.assertTrue(C['Hypnotic Pattern']['end_on_any_damage'])
 def test_knife(self):self.assertTrue(C['Ice Knife']['explosion_on_hit_or_miss']);self.assertEqual(C['Ice Knife']['explosion_success_damage'],0);self.assertEqual(C['Ice Knife']['upcast_cold_dice_per_slot'],'1d6')
 def test_storm(self):self.assertEqual((C['Ice Storm']['bludgeoning_damage'],C['Ice Storm']['cold_damage'],C['Ice Storm']['upcast_bludgeoning_dice_per_slot']),('2d10','4d6','1d10'));self.assertEqual(C['Ice Storm']['terrain_deadline'],'end_of_caster_next_turn')
 def test_identify(self):self.assertTrue(C['Identify']['touch_throughout_cast']);self.assertIn('creating_spell_name_if_any',C['Identify']['object_information']);self.assertEqual(C['Identify']['creature_information'],'ongoing_spells')
 def test_script(self):self.assertTrue(C['Illusory Script']['dispel_erases_original_and_illusion']);self.assertTrue(C['Illusory Script']['alternative_language_known']);self.assertTrue(C['Illusory Script']['truesight_reads_hidden_message'])
 def test_prison(self):self.assertEqual(C['Imprisonment']['modes'],['Burial','Chaining','Hedged Prison','Minimus Containment','Slumber']);self.assertEqual(C['Imprisonment']['success_immunity_hours'],24);self.assertEqual(C['Imprisonment']['ending_trigger_likely_within_years'],10);self.assertEqual(C['Imprisonment']['dispel_required_slot'],9)
 def test_cloud(self):self.assertEqual(C['Incendiary Cloud']['max_saves_per_creature_per_turn'],1);self.assertIn('sphere_moves_into_creature_space',C['Incendiary Cloud']['save_triggers']);self.assertEqual(C['Incendiary Cloud']['move_ft'],10)
 def test_wounds(self):self.assertEqual((C['Inflict Wounds']['save'],C['Inflict Wounds']['damage'],C['Inflict Wounds']['success_damage_multiplier']),('Constitution','2d10',0.5))
 def test_insect(self):self.assertEqual(C['Insect Plague']['max_saves_per_creature_per_turn'],1);self.assertIn('first_entry_on_a_turn',C['Insect Plague']['save_triggers']);self.assertEqual(C['Insect Plague']['obscuration'],'Lightly Obscured')
 def test_summons(self):self.assertTrue(C['Instant Summons']['activation_crush_sapphire']);self.assertFalse(N['Instant Summons']['material']['consumed']);self.assertTrue(C['Instant Summons']['held_or_carried_by_other_blocks_transport']);self.assertEqual(C['Instant Summons']['max_weight_lb'],10)
 def test_dance(self):self.assertTrue(C['Irresistible Dance']['success_spend_all_movement']);self.assertEqual(C['Irresistible Dance']['repeat_save_action'],'Action');self.assertEqual(C['Irresistible Dance']['success_dance_deadline'],'end_of_target_next_turn')
 def test_invisibility(self):self.assertEqual(C['Invisibility']['early_end_triggers'],['makes_attack_roll','deals_damage','casts_spell']);self.assertEqual(C['Invisibility']['upcast_targets_per_slot'],1)
 def test_field_count(self):self.assertEqual(sum(len(r['reference_checks']) for r in R),120);self.assertEqual(sum(len(r['reference_checks']) for r in M['records']),337)
if __name__=='__main__':unittest.main(verbosity=2)
