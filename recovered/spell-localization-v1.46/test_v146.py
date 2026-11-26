import json,pathlib,unittest
P=pathlib.Path(__file__).parent
D=json.loads((P/'spell_delta_v146.json').read_text()); R=D['records']; N={r['name_en']:r for r in R}; C={n:r['reference_checks'] for n,r in N.items()}
B=json.loads((P/'spell_combined_v142_v145.json').read_text()); M=json.loads((P/'spell_combined_v142_v146.json').read_text())
class Delta146(unittest.TestCase):
 def test_ordinals(self):self.assertEqual([r['ordinal'] for r in R],list(range(193,205)))
 def test_names_levels(self):self.assertEqual([(r['name_en'],r['level']) for r in R],[('Mage Hand',0),('Magic Circle',3),('Magic Jar',6),('Magic Missile',1),('Magic Mouth',2),('Magic Weapon',2),('Magnificent Mansion',7),('Major Image',3),('Mass Cure Wounds',5),('Mass Heal',9),('Mass Healing Word',3),('Mass Suggestion',6)])
 def test_pages(self):self.assertEqual([r['source']['printed_pages'] for r in R],[[145],[145,146],[146],[146],[146],[146,147],[147],[147],[147],[147],[148],[148]])
 def test_shape(self):
  for r in R:
   self.assertEqual(set(r),set(B['records'][0])); self.assertEqual(r['source']['url'],D['source_url']); self.assertEqual(r['source']['anchor'],r['name_en']); self.assertEqual(r['source']['visual_check'],'REVIEWED')
 def test_release(self):self.assertTrue(all(r['editorial_status']=='PENDING' and r['integration_status']=='NOT_VERIFIED' and r['release_status']=='NO_GO' for r in R));self.assertFalse(M['parent_merge_verified'])
 def test_components(self):
  for r in R:self.assertEqual('M' in r['components'],r['material'] is not None); self.assertTrue(set(r['components'])<=set('VSM'))
 def test_material_cost(self):self.assertEqual({r['name_en']:(r['material']['minimum_gp'],r['material']['consumed']) for r in R if r['material'] and r['material']['minimum_gp']},{'Magic Circle':(100,True),'Magic Jar':(500,False),'Magic Mouth':(10,True),'Magnificent Mansion':(15,False)})
 def test_concentration(self):self.assertEqual({r['name_en'] for r in R if r['concentration']},{'Major Image'});self.assertTrue(all(r['concentration']==r['duration'].startswith('Concentration') for r in R))
 def test_ritual(self):self.assertEqual([r['name_en'] for r in R if 'Ritual' in r['casting_time']],['Magic Mouth'])
 def test_preserve(self):self.assertEqual(M['records'][:48],B['records']);self.assertEqual(M['records'][48:],R)
 def test_combined(self):self.assertEqual([r['ordinal'] for r in M['records']],list(range(145,205)));self.assertEqual(len({r['name_en'] for r in M['records']}),60)
 def test_license_markdown(self):
  md=(P/'SPELL_LOCALIZATION_v146.md').read_text();self.assertEqual(D['attribution'],B['attribution']);self.assertIn(D['attribution'],md)
  for r in R:self.assertIn(f"## {r['ordinal']}. {r['name_en']}",md);self.assertIn(r['description_id'],md)
 def test_hand(self):
  c=C['Mage Hand'];self.assertEqual((c['max_distance_ft'],c['move_per_action_ft'],c['carry_max_lb'],c['later_control']),(30,30,10,'Magic Action'));self.assertFalse(c['can_attack']);self.assertFalse(c['can_activate_magic_items']);self.assertTrue(c['recast_vanishes'])
 def test_circle(self):
  c=C['Magic Circle'];self.assertEqual((c['radius_ft'],c['height_ft'],c['teleport_or_planar_save'],c['upcast_hours_per_slot']),(10,20,'Charisma',1));self.assertEqual(c['eligible_types'],['Celestial','Elemental','Fey','Fiend','Undead']);self.assertTrue(c['reversible']);self.assertTrue(c['voluntary_nonmagical_entry_blocked']);self.assertTrue(c['attack_disadvantage']);self.assertEqual(c['protected_effects'],['possession','Charmed','Frightened'])
 def test_jar_possession(self):
  c=C['Magic Jar'];self.assertEqual((c['target_type'],c['possession_save'],c['retry_after_success_hours'],c['possession_range_ft']),('Humanoid','Charisma',24,100));self.assertEqual(c['blocked_by'],['Protection from Evil and Good','Magic Circle']);self.assertEqual(c['replaced_stats'],['Hit Points','Hit Point Dice','Strength','Dexterity','Constitution','Speed','senses']);self.assertTrue(c['other_stats_retained'])
 def test_jar_return_and_death(self):
  c=C['Magic Jar'];self.assertEqual((c['return_action'],c['return_max_ft'],c['host_death_save'],c['host_death_dc']),('Magic Action',100,'Charisma','own spell save DC'));self.assertTrue(c['host_death_return_requires_success_and_range']);self.assertTrue(c['own_body_alive_and_in_range_required']);self.assertTrue(c['other_soul_return_alive_and_in_range_required']);self.assertTrue(c['container_destroyed_on_spell_end']);self.assertFalse(N['Magic Jar']['material']['consumed'])
 def test_missile(self):
  c=C['Magic Missile'];self.assertEqual((c['base_darts'],c['damage_per_dart'],c['damage_type'],c['upcast_darts_per_slot']),(3,'1d4+1','Force',1));self.assertTrue(c['simultaneous']);self.assertTrue(c['split_targets']);self.assertFalse(c['attack_roll_required'])
 def test_mouth(self):
  c=C['Magic Mouth'];self.assertEqual((c['max_words'],c['max_delivery_minutes'],c['trigger_radius_ft']),(25,10,30));self.assertEqual(c['trigger_modalities'],['visual','audible']);self.assertTrue(c['repeat_optional']);self.assertTrue(c['not_worn_or_carried_by_other'])
 def test_weapon(self):
  c=C['Magic Weapon'];self.assertEqual(N['Magic Weapon']['casting_time'],'Bonus Action');self.assertFalse(N['Magic Weapon']['concentration']);self.assertEqual([c['upcast_bonus_by_slot'][str(n)] for n in range(2,10)],[1,2,2,2,3,3,3,3]);self.assertTrue(c['recast_ends'])
 def test_mansion(self):
  c=C['Magnificent Mansion'];self.assertEqual((c['door_width_ft'],c['door_height_ft'],c['door_control_distance_ft'],c['max_contiguous_cubes'],c['cube_side_ft'],c['meal_people_max'],c['servants']),(5,10,30,50,10,100,100));self.assertFalse(c['door_control_action_required']);self.assertTrue(c['servants_no_attack_or_direct_harm']);self.assertTrue(c['servants_cannot_leave']);self.assertTrue(c['ends_expels_creatures_and_objects'])
 def test_image(self):
  c=C['Major Image'];self.assertEqual((c['max_cube_side_ft'],c['move_action'],c['examine_action'],c['examine_check'],c['upcast_threshold'],c['upcast_duration']),(20,'Magic Action','Study','Intelligence (Investigation)',4,'Until dispelled'));self.assertFalse(c['can_damage']);self.assertFalse(c['can_cause_conditions']);self.assertFalse(c['upcast_concentration']);self.assertTrue(c['physical_interaction_reveals'])
 def test_mass_cure(self):
  c=C['Mass Cure Wounds'];self.assertEqual((c['sphere_radius_ft'],c['max_targets'],c['healing_dice'],c['upcast_healing_per_slot']),(30,6,'5d8','1d8'));self.assertTrue(c['add_spellcasting_modifier'])
 def test_mass_heal(self):
  c=C['Mass Heal'];self.assertEqual(c['total_healing_budget'],700);self.assertIsNone(c['target_count_limit']);self.assertEqual(c['conditions_removed'],['Blinded','Deafened','Poisoned']);self.assertTrue(c['allocation_by_caster'])
 def test_mass_healing_word(self):
  c=C['Mass Healing Word'];self.assertEqual((c['max_targets'],c['healing_dice'],c['upcast_healing_per_slot']),(6,'2d4','1d4'));self.assertEqual(N['Mass Healing Word']['casting_time'],'Bonus Action')
 def test_mass_suggestion(self):
  c=C['Mass Suggestion'];self.assertEqual((c['max_words'],c['max_targets'],c['save'],c['failure_condition']),(25,12,'Wisdom','Charmed'));self.assertTrue(c['no_obvious_damage_to_any_target_or_allies']);self.assertTrue(c['ends_on_damage_by_caster_or_allies']);self.assertTrue(c['ends_on_completion']);self.assertEqual(c['upcast_duration_days'],{'7':10,'8':30,'9':366})
 def test_fields(self):self.assertEqual(sum(len(r['reference_checks']) for r in R),125);self.assertEqual(sum(len(r['reference_checks']) for r in M['records']),545)
if __name__=='__main__':unittest.main(verbosity=2)
