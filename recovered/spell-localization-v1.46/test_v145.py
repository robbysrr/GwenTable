import unittest,json,pathlib
P=pathlib.Path(__file__).parent
D=json.loads((P/'spell_delta_v145.json').read_text()); R=D['records']; N={r['name_en']:r for r in R}; C={n:r['reference_checks'] for n,r in N.items()}
B=json.loads((P/'spell_combined_v142_v144.json').read_text()); M=json.loads((P/'spell_combined_v142_v145.json').read_text())
class Delta145(unittest.TestCase):
 def test_ordinals(self):self.assertEqual([r['ordinal'] for r in R],list(range(181,193)))
 def test_names_levels(self):self.assertEqual([(r['name_en'],r['level']) for r in R],[('Jump',1),('Knock',2),('Legend Lore',5),('Lesser Restoration',2),('Levitate',2),('Light',0),('Lightning Bolt',3),('Locate Animals or Plants',2),('Locate Creature',4),('Locate Object',2),('Longstrider',1),('Mage Armor',1)])
 def test_pages(self):self.assertEqual([r['source']['printed_pages'] for r in R],[[143],[143,144],[144],[144],[144],[144],[144],[144],[145],[145],[145],[145]])
 def test_metadata(self):
  for r in R:
   self.assertEqual(set(r),set(B['records'][0]));self.assertEqual(r['source']['url'],D['source_url']);self.assertEqual(r['source']['anchor'],r['name_en']);self.assertEqual(r['source']['visual_check'],'REVIEWED')
 def test_release(self):self.assertTrue(all(r['editorial_status']=='PENDING' and r['integration_status']=='NOT_VERIFIED' and r['release_status']=='NO_GO' for r in R));self.assertFalse(M['parent_merge_verified'])
 def test_components(self):
  for r in R:self.assertEqual('M' in r['components'],r['material'] is not None);self.assertTrue(set(r['components'])<=set('VSM'))
 def test_mixed_material(self):
  r=N['Legend Lore']; parts=C['Legend Lore']['material_parts'];self.assertIsNone(r['material']['consumed']);self.assertEqual(r['material']['minimum_gp'],450);self.assertEqual(sum(p['quantity']*p['minimum_gp_each'] for p in parts),450);self.assertEqual(sum(p['quantity']*p['minimum_gp_each'] for p in parts if p['consumed']),250);self.assertEqual(parts[1],dict(item='ivory strips',quantity=4,minimum_gp_each=50,consumed=False));self.assertEqual([x['name_en'] for x in R if x['material'] and x['material']['consumed'] is None],['Legend Lore'])
 def test_concentration(self):self.assertEqual({r['name_en'] for r in R if r['concentration']},{'Levitate','Locate Creature','Locate Object'});self.assertTrue(all(r['concentration']==r['duration'].startswith('Concentration') for r in R))
 def test_rituals(self):self.assertEqual({r['name_en'] for r in R if 'Ritual' in r['casting_time']},{'Locate Animals or Plants'})
 def test_license(self):self.assertEqual(D['attribution'],B['attribution']);self.assertIn(D['attribution'],(P/'SPELL_LOCALIZATION_v145.md').read_text())
 def test_markdown(self):
  md=(P/'SPELL_LOCALIZATION_v145.md').read_text()
  for r in R:self.assertIn(f"## {r['ordinal']}. {r['name_en']}",md);self.assertIn(r['description_id'],md)
  self.assertIn('konsumsi campuran',md)
 def test_preserve_parent(self):self.assertEqual(M['records'][:36],B['records']);self.assertEqual(M['records'][36:],R)
 def test_combined(self):self.assertEqual([r['ordinal'] for r in M['records']],list(range(145,193)));self.assertEqual(len({r['name_en'] for r in M['records']}),48)
 def test_jump(self):self.assertEqual(N['Jump']['casting_time'],'Bonus Action');self.assertEqual((C['Jump']['jump_max_ft'],C['Jump']['movement_cost_ft'],C['Jump']['max_uses_per_target_turn']),(30,10,1));self.assertTrue(C['Jump']['willing_target']);self.assertEqual(C['Jump']['upcast_targets_per_slot'],1)
 def test_knock(self):self.assertEqual((C['Knock']['locks_opened_per_cast'],C['Knock']['arcane_lock_suppressed_minutes'],C['Knock']['noise_radius_ft']),(1,10,300));self.assertFalse(C['Knock']['arcane_lock_dispelled'])
 def test_legend_lore(self):self.assertTrue(C['Legend Lore']['not_famous_fails']);self.assertTrue(C['Legend Lore']['information_accurate']);self.assertTrue(C['Legend Lore']['gm_determines_lore'])
 def test_lesser_restoration(self):self.assertEqual(N['Lesser Restoration']['casting_time'],'Bonus Action');self.assertEqual(C['Lesser Restoration']['conditions_removed_count'],1);self.assertEqual(C['Lesser Restoration']['eligible_conditions'],['Blinded','Deafened','Paralyzed','Poisoned'])
 def test_levitate(self):self.assertEqual((C['Levitate']['initial_rise_ft'],C['Levitate']['object_weight_max_lb'],C['Levitate']['altitude_change_max_ft']),(20,500,20));self.assertEqual(C['Levitate']['unwilling_save'],'Constitution');self.assertEqual(C['Levitate']['other_move_cost'],'Magic Action');self.assertTrue(C['Levitate']['other_target_stays_in_range'])
 def test_light(self):self.assertEqual((C['Light']['max_object_size'],C['Light']['bright_radius_ft'],C['Light']['dim_additional_ft']),('Large',20,20));self.assertTrue(C['Light']['recast_ends']);self.assertTrue(C['Light']['not_worn_or_carried_by_other'])
 def test_lightning(self):self.assertEqual((C['Lightning Bolt']['line_length_ft'],C['Lightning Bolt']['line_width_ft'],C['Lightning Bolt']['save'],C['Lightning Bolt']['damage'],C['Lightning Bolt']['success_damage_multiplier'],C['Lightning Bolt']['upcast_dice_per_slot']),(100,5,'Dexterity','8d6',0.5,'1d6'))
 def test_locate_animals(self):self.assertEqual(C['Locate Animals or Plants']['search_radius_miles'],5);self.assertEqual(C['Locate Animals or Plants']['target_kinds'],['Beast','Plant creature','nonmagical plant']);self.assertTrue(C['Locate Animals or Plants']['nearest_only'])
 def test_locate_creature(self):self.assertEqual(C['Locate Creature']['search_radius_ft'],1000);self.assertEqual(C['Locate Creature']['kind_prior_sighting_max_ft'],30);self.assertTrue(C['Locate Creature']['different_form_blocks']);self.assertTrue(C['Locate Creature']['any_lead_thickness_blocks_direct_path'])
 def test_locate_object(self):self.assertEqual(C['Locate Object']['search_radius_ft'],1000);self.assertEqual(C['Locate Object']['specific_object_prior_sighting_max_ft'],30);self.assertTrue(C['Locate Object']['any_lead_thickness_blocks_direct_path']);self.assertNotIn('different_form_blocks',C['Locate Object'])
 def test_longstrider(self):self.assertEqual((C['Longstrider']['speed_bonus_ft'],C['Longstrider']['upcast_targets_per_slot']),(10,1));self.assertFalse(N['Longstrider']['concentration'])
 def test_mage_armor(self):self.assertEqual((C['Mage Armor']['base_ac_constant'],C['Mage Armor']['base_ac_modifier']),(13,'Dexterity'));self.assertTrue(C['Mage Armor']['base_ac_replacement']);self.assertTrue(C['Mage Armor']['ends_on_donning_armor'])
 def test_field_count(self):self.assertEqual(sum(len(r['reference_checks']) for r in R),83);self.assertEqual(sum(len(r['reference_checks']) for r in M['records']),420)
if __name__=='__main__':unittest.main(verbosity=2)
